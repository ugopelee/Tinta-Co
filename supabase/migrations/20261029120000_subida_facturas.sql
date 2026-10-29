-- =====================================================================
-- Subida de facturas de proveedor desde el CRM
--
-- Cola entre el CRM y el agente lector. El CRM sube el original al bucket
-- «facturas-proveedor» (bajo `entrada/`) y apunta aquí una fila pendiente;
-- el agente la recoge, la lee y, si sale bien, crea la fila en
-- `facturas_proveedor` y borra esta. Si falla, la deja en «error» con el
-- motivo para que se vea en el CRM. Así nadie tiene que tocar la carpeta
-- del servidor donde corre el agente.
--
-- Depende de `20261028120000_modulo_ventas_facturacion.sql` (bucket y
-- `es_propietario()`). Se pega entera en el editor SQL de Supabase; se
-- deshace con `supabase/revertir/20261029120000_subida_facturas.sql`.
-- =====================================================================

create table public.facturas_entrantes (
  id uuid primary key default gen_random_uuid(),
  -- Ruta dentro del bucket privado «facturas-proveedor».
  archivo text not null,
  nombre_archivo text not null,
  -- «leyendo» la pone el agente al reclamarla: dos agentes a la vez no leen
  -- (ni pagan) la misma factura dos veces.
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'leyendo', 'error')),
  motivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index facturas_entrantes_por_estado on public.facturas_entrantes (estado, created_at);

-- El agente usa la clave service_role, que salta RLS; desde el CRM, solo el
-- propietario. Las políticas del bucket ya son las de facturas_proveedor.
alter table public.facturas_entrantes enable row level security;

create policy facturas_entrantes_propietario on public.facturas_entrantes
  for all using (public.es_propietario()) with check (public.es_propietario());
