-- =====================================================================
-- Módulo de ventas y facturación de Tinta&Co
--
-- Presupuestos y ventas con sus líneas, facturas emitidas a partir de una
-- venta confirmada (numeración correlativa por año e inmutables una vez
-- emitidas) y facturas de proveedor que lee el agente y revisa el
-- propietario.
--
-- Se apoya en lo que ya existe en el proyecto: `clientes`, `citas`,
-- `disenos` y la función `es_propietario()`. Todo es solo del propietario.
-- Para deshacerlo: supabase/revertir/20261028120000_modulo_ventas_facturacion.sql
-- =====================================================================

-- --- 1. Tablas ---------------------------------------------------------------

-- Contador por serie y año («P-2026», «F-2026»). Solo lo toca siguiente_numero.
create table public.series (
  clave text primary key,
  ultimo int not null
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  -- La pone el trigger: «P-2026-0001».
  numero text not null unique,
  cliente_id uuid not null references public.clientes (id),
  cita_id uuid references public.citas (id) on delete set null,
  estado text not null default 'presupuesto'
    check (estado in ('presupuesto', 'confirmada', 'facturada', 'cancelada')),
  fecha date not null default (now() at time zone 'Europe/Madrid')::date,
  valida_hasta date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ventas_por_cliente on public.ventas (cliente_id);

create table public.lineas_venta (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id) on delete cascade,
  orden smallint not null default 0,
  descripcion text not null check (length(trim(descripcion)) > 0),
  diseno_id uuid references public.disenos (id) on delete set null,
  cantidad numeric(10, 2) not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  descuento numeric(5, 2) not null default 0 check (descuento between 0 and 100),
  iva smallint not null default 21 check (iva in (0, 4, 10, 21))
);

create index lineas_venta_por_venta on public.lineas_venta (venta_id, orden);

create table public.facturas (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  serie int not null,
  -- Una venta se factura una sola vez.
  venta_id uuid not null unique references public.ventas (id),
  cliente_id uuid not null references public.clientes (id),
  cita_id uuid references public.citas (id) on delete set null,
  fecha_emision date not null,
  fecha_vencimiento date not null,
  base numeric(12, 2) not null,
  cuota_iva numeric(12, 2) not null,
  total numeric(12, 2) not null,
  estado text not null default 'emitida'
    check (estado in ('emitida', 'cobrada', 'anulada')),
  fecha_cobro date,
  metodo_pago text,
  motivo_anulacion text,
  created_at timestamptz not null default now()
);

create index facturas_por_cliente on public.facturas (cliente_id);

-- Copia de las líneas de la venta en el momento de facturar, con el importe
-- ya calculado: la factura no cambia aunque luego cambie el catálogo.
create table public.lineas_factura (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas (id) on delete cascade,
  orden smallint not null default 0,
  descripcion text not null,
  diseno_id uuid references public.disenos (id) on delete set null,
  cantidad numeric(10, 2) not null,
  precio_unitario numeric(12, 2) not null,
  descuento numeric(5, 2) not null,
  iva smallint not null,
  -- Base de la línea (con descuento), redondeada a céntimos.
  importe numeric(12, 2) not null
);

create index lineas_factura_por_factura on public.lineas_factura (factura_id, orden);

-- Lo que el agente lee del PDF o la foto. El NIF puede faltar; el resto es
-- obligatorio para el agente.
create table public.facturas_proveedor (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  fecha date not null,
  proveedor text not null,
  nif text,
  base numeric(12, 2) not null,
  iva numeric(12, 2) not null,
  total numeric(12, 2) not null,
  -- Ruta dentro del bucket privado «facturas-proveedor».
  archivo text not null,
  nombre_archivo text not null,
  estado text not null default 'por_revisar'
    check (estado in ('por_revisar', 'validada', 'descartada')),
  revisada_at timestamptz,
  created_at timestamptz not null default now()
);

-- Duplicados: mismo NIF (o, sin él, mismo proveedor) y mismo número.
create unique index facturas_proveedor_unica
  on public.facturas_proveedor (coalesce(nif, lower(trim(proveedor))), numero);

-- --- 2. Numeración -------------------------------------------------------------

-- 'F' -> 'F-2026-0001'. El upsert bloquea la fila de la serie hasta el final
-- de la transacción, así que dos llamadas a la vez nunca repiten número.
-- No se concede a nadie: solo la llaman las funciones de abajo.
create or replace function public.siguiente_numero(prefijo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  anio text := to_char(now() at time zone 'Europe/Madrid', 'YYYY');
  n int;
begin
  insert into public.series (clave, ultimo) values (prefijo || '-' || anio, 1)
  on conflict (clave) do update set ultimo = public.series.ultimo + 1
  returning ultimo into n;

  return prefijo || '-' || anio || '-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function public.numerar_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero is null then
    new.numero := public.siguiente_numero('P');
  end if;
  return new;
end;
$$;

-- `numero` es not null: el trigger lo rellena antes de que se compruebe.
create trigger ventas_numerar
  before insert on public.ventas
  for each row execute function public.numerar_venta();

create or replace function public.tocar_venta()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger ventas_tocar
  before update on public.ventas
  for each row execute function public.tocar_venta();

-- --- 3. Facturar una venta ------------------------------------------------------

create or replace function public.facturar_venta(p_venta uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.ventas;
  hoy date := (now() at time zone 'Europe/Madrid')::date;
  base_total numeric(12, 2);
  cuota_total numeric(12, 2);
  nueva uuid;
begin
  if not public.es_propietario() then
    raise exception 'Solo el propietario puede facturar.';
  end if;

  -- Se bloquea la venta y el estado se mira ya con el bloqueo: si otra
  -- llamada llega a la vez, espera y encuentra la venta ya facturada.
  select * into v from public.ventas where id = p_venta for update;
  if not found then
    raise exception 'Esa venta no existe.';
  end if;
  if v.estado <> 'confirmada' then
    raise exception 'Solo se puede facturar una venta confirmada.';
  end if;

  if not exists (select 1 from public.lineas_venta where venta_id = p_venta) then
    raise exception 'La venta no tiene líneas.';
  end if;

  select
    coalesce(sum(round(cantidad * precio_unitario * (1 - descuento / 100), 2)), 0),
    coalesce(sum(round(round(cantidad * precio_unitario * (1 - descuento / 100), 2) * iva / 100, 2)), 0)
    into base_total, cuota_total
    from public.lineas_venta where venta_id = p_venta;

  if base_total + cuota_total <= 0 then
    raise exception 'El total de la venta debe ser mayor que cero.';
  end if;

  insert into public.facturas (
    numero, serie, venta_id, cliente_id, cita_id,
    fecha_emision, fecha_vencimiento, base, cuota_iva, total
  ) values (
    public.siguiente_numero('F'), extract(year from hoy)::int, v.id, v.cliente_id, v.cita_id,
    hoy, hoy + 30, base_total, cuota_total, base_total + cuota_total
  ) returning id into nueva;

  insert into public.lineas_factura (
    factura_id, orden, descripcion, diseno_id, cantidad, precio_unitario, descuento, iva, importe
  )
  select nueva, orden, descripcion, diseno_id, cantidad, precio_unitario, descuento, iva,
         round(cantidad * precio_unitario * (1 - descuento / 100), 2)
    from public.lineas_venta where venta_id = p_venta;

  update public.ventas set estado = 'facturada' where id = p_venta;

  return nueva;
end;
$$;

-- --- 4. Una factura emitida no se reescribe ---------------------------------------
-- Solo cambian el estado y los datos del cobro o de la anulación, y solo
-- emitida -> cobrada o emitida -> anulada.

create or replace function public.proteger_factura()
returns trigger
language plpgsql
as $$
begin
  if new.numero is distinct from old.numero
     or new.serie is distinct from old.serie
     or new.venta_id is distinct from old.venta_id
     or new.cliente_id is distinct from old.cliente_id
     or new.cita_id is distinct from old.cita_id
     or new.fecha_emision is distinct from old.fecha_emision
     or new.fecha_vencimiento is distinct from old.fecha_vencimiento
     or new.base is distinct from old.base
     or new.cuota_iva is distinct from old.cuota_iva
     or new.total is distinct from old.total then
    raise exception 'Una factura emitida no se puede modificar.';
  end if;

  if new.estado is distinct from old.estado
     and not (old.estado = 'emitida' and new.estado in ('cobrada', 'anulada')) then
    raise exception 'Una factura % no puede pasar a %.', old.estado, new.estado;
  end if;

  return new;
end;
$$;

create trigger facturas_proteger
  before update on public.facturas
  for each row execute function public.proteger_factura();

-- --- 5. Seguridad por filas ---------------------------------------------------------
-- Todo es del propietario. Las facturas nacen solo en facturar_venta (sin
-- insert) y no se borran; sus líneas solo se leen.

alter table public.series enable row level security;
alter table public.ventas enable row level security;
alter table public.lineas_venta enable row level security;
alter table public.facturas enable row level security;
alter table public.lineas_factura enable row level security;
alter table public.facturas_proveedor enable row level security;

create policy series_propietario on public.series
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy ventas_propietario on public.ventas
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy lineas_venta_propietario on public.lineas_venta
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy facturas_proveedor_propietario on public.facturas_proveedor
  for all using (public.es_propietario()) with check (public.es_propietario());

create policy facturas_ver on public.facturas
  for select using (public.es_propietario());
create policy facturas_actualizar on public.facturas
  for update using (public.es_propietario()) with check (public.es_propietario());

create policy lineas_factura_ver on public.lineas_factura
  for select using (public.es_propietario());

-- Solo usuarios con sesión; dentro, cada función comprueba el rol.
revoke all on function public.siguiente_numero(text) from public, anon, authenticated;
revoke all on function public.numerar_venta() from public, anon, authenticated;
revoke all on function public.facturar_venta(uuid) from public, anon;
grant execute on function public.facturar_venta(uuid) to authenticated;

-- --- 6. Archivos: facturas de proveedor (privado) -----------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'facturas-proveedor', 'facturas-proveedor', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy facturas_proveedor_archivos_propietario on storage.objects
  for all to authenticated
  using (bucket_id = 'facturas-proveedor' and public.es_propietario())
  with check (bucket_id = 'facturas-proveedor' and public.es_propietario());
