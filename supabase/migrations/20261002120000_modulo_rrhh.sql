-- =====================================================================
-- Módulo de Recursos Humanos de Tinta&Co
--
-- Fichas del equipo, incorporación con checklist, fichajes de entrada y
-- salida, vacaciones con aprobación, evaluación trimestral (1 a 5) y
-- nóminas en PDF que firma el propio empleado.
--
-- Se apoya en lo que ya existe en el proyecto: la tabla `perfiles` y la
-- función `es_propietario()`. Se puede ejecutar entera en el editor SQL de
-- Supabase; es idempotente salvo los `create table`.
-- =====================================================================

-- --- 1. Rol «empleado» ----------------------------------------------------
-- Un empleado entra al CRM, pero solo a su portal (/portal). El rol puede
-- estar guardado como texto con CHECK o como enum: se cubren los dos casos.
do $$
declare
  restriccion record;
  tipo_rol regtype;
  es_enum boolean;
begin
  select a.atttypid::regtype, t.typtype = 'e'
    into tipo_rol, es_enum
    from pg_attribute a
    join pg_type t on t.oid = a.atttypid
   where a.attrelid = 'public.perfiles'::regclass and a.attname = 'rol';

  if es_enum then
    execute format('alter type %s add value if not exists %L', tipo_rol, 'empleado');
  else
    for restriccion in
      select conname from pg_constraint
       where conrelid = 'public.perfiles'::regclass
         and contype = 'c'
         and pg_get_constraintdef(oid) ilike '%rol%'
    loop
      execute format('alter table public.perfiles drop constraint %I', restriccion.conname);
    end loop;

    alter table public.perfiles
      add constraint perfiles_rol_check
      check (rol is null or rol in ('propietario', 'artista', 'empleado')) not valid;
  end if;
end $$;

-- --- 2. Tablas --------------------------------------------------------------

create table public.empleados (
  id uuid primary key default gen_random_uuid(),
  -- La cuenta de acceso al CRM. Nula hasta que se crea (o si se borra).
  perfil_id uuid unique references public.perfiles (id) on delete set null,
  nombre text not null check (length(trim(nombre)) > 0),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono text,
  puesto text not null,
  departamento text,
  foto_url text,
  fecha_alta date not null default (now() at time zone 'Europe/Madrid')::date,
  estado text not null default 'incorporacion'
    check (estado in ('incorporacion', 'activo', 'baja')),
  created_at timestamptz not null default now()
);

create table public.tareas_incorporacion (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete cascade,
  titulo text not null,
  descripcion text,
  orden smallint not null default 0,
  -- Las que tiene que marcar el propio empleado (leer el manual…).
  de_empleado boolean not null default false,
  hecha boolean not null default false,
  hecha_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.fichajes (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete cascade,
  entrada timestamptz not null default now(),
  salida timestamptz,
  check (salida is null or salida > entrada)
);

-- Nunca dos entradas abiertas a la vez para la misma persona.
create unique index fichajes_uno_abierto on public.fichajes (empleado_id) where salida is null;
create index fichajes_por_empleado on public.fichajes (empleado_id, entrada desc);

create table public.vacaciones (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete cascade,
  desde date not null,
  hasta date not null,
  motivo text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada')),
  respuesta text,
  respondida_at timestamptz,
  created_at timestamptz not null default now(),
  check (hasta >= desde)
);

create table public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete cascade,
  -- Mismo formato que Informes: «2026-T3».
  trimestre text not null check (trimestre ~ '^\d{4}-T[1-4]$'),
  nota smallint not null check (nota between 1 and 5),
  comentario text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empleado_id, trimestre)
);

create table public.nominas (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete cascade,
  periodo text not null check (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  -- Ruta dentro del bucket privado «nominas».
  archivo text not null,
  -- Firma dibujada por el empleado, como PNG en data URL.
  firma text,
  firmada_at timestamptz,
  created_at timestamptz not null default now(),
  unique (empleado_id, periodo)
);

-- --- 3. Quién es el empleado de la sesión ------------------------------------

create or replace function public.mi_empleado_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.empleados where perfil_id = auth.uid() and estado <> 'baja';
$$;

-- --- 4. Seguridad por filas ---------------------------------------------------
-- El propietario lo ve y gestiona todo. El empleado solo lee lo suyo; lo que
-- cambia (fichar, firmar, marcar su tarea) pasa por funciones que validan.

alter table public.empleados enable row level security;
alter table public.tareas_incorporacion enable row level security;
alter table public.fichajes enable row level security;
alter table public.vacaciones enable row level security;
alter table public.evaluaciones enable row level security;
alter table public.nominas enable row level security;

create policy empleados_propietario on public.empleados
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy empleados_propio on public.empleados
  for select using (perfil_id = auth.uid());

create policy tareas_propietario on public.tareas_incorporacion
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy tareas_propias on public.tareas_incorporacion
  for select using (empleado_id = public.mi_empleado_id());

create policy fichajes_propietario on public.fichajes
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy fichajes_propios on public.fichajes
  for select using (empleado_id = public.mi_empleado_id());

create policy vacaciones_propietario on public.vacaciones
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy vacaciones_propias on public.vacaciones
  for select using (empleado_id = public.mi_empleado_id());
-- Pedir sí, pero siempre como pendiente y a su nombre.
create policy vacaciones_pedir on public.vacaciones
  for insert with check (
    empleado_id = public.mi_empleado_id()
    and estado = 'pendiente'
    and respuesta is null
    and respondida_at is null
  );

create policy evaluaciones_propietario on public.evaluaciones
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy evaluaciones_propias on public.evaluaciones
  for select using (empleado_id = public.mi_empleado_id());

create policy nominas_propietario on public.nominas
  for all using (public.es_propietario()) with check (public.es_propietario());
create policy nominas_propias on public.nominas
  for select using (empleado_id = public.mi_empleado_id());

-- --- 5. Acciones del empleado -------------------------------------------------

-- Entrada si no hay nada abierto; salida si lo hay. La hora la pone el
-- servidor: el navegador del empleado no decide cuándo ha llegado.
create or replace function public.fichar()
returns public.fichajes
language plpgsql
security definer
set search_path = public
as $$
declare
  yo uuid := public.mi_empleado_id();
  fila public.fichajes;
begin
  if yo is null then
    raise exception 'Esta cuenta no es de ningún empleado en activo.';
  end if;

  update public.fichajes set salida = now()
   where empleado_id = yo and salida is null
  returning * into fila;

  if not found then
    insert into public.fichajes (empleado_id) values (yo) returning * into fila;
  end if;

  return fila;
end;
$$;

create or replace function public.firmar_nomina(p_nomina uuid, p_firma text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_firma is null
     or p_firma not like 'data:image/png;base64,%'
     or length(p_firma) > 400000 then
    raise exception 'La firma no es válida.';
  end if;

  update public.nominas
     set firma = p_firma, firmada_at = now()
   where id = p_nomina
     and empleado_id = public.mi_empleado_id()
     and firmada_at is null;

  if not found then
    raise exception 'Esta nómina no existe, no es tuya o ya está firmada.';
  end if;
end;
$$;

create or replace function public.completar_mi_tarea(p_tarea uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tareas_incorporacion
     set hecha = true, hecha_at = now()
   where id = p_tarea
     and empleado_id = public.mi_empleado_id()
     and de_empleado
     and not hecha;

  if not found then
    raise exception 'No puedes marcar esta tarea.';
  end if;
end;
$$;

-- --- 6. Incorporación completada => empleado dentro ----------------------------

create or replace function public.revisar_incorporacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.tareas_incorporacion
     where empleado_id = new.empleado_id and not hecha
  ) then
    update public.empleados set estado = 'activo'
     where id = new.empleado_id and estado = 'incorporacion';
  else
    -- Si se desmarca una tarea, vuelve a estar en incorporación.
    update public.empleados set estado = 'incorporacion'
     where id = new.empleado_id and estado = 'activo';
  end if;
  return new;
end;
$$;

create trigger tareas_revisar_incorporacion
  after update of hecha on public.tareas_incorporacion
  for each row execute function public.revisar_incorporacion();

-- --- 7. Cuenta de acceso al CRM -------------------------------------------------
-- Crea el usuario de Supabase Auth con email y contraseña, ya confirmado (no
-- depende del correo ni de sus límites de envío), y le da el rol «empleado».
-- Solo la puede usar un propietario.

create or replace function public.crear_cuenta_empleado(p_empleado uuid, p_clave text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  ficha public.empleados;
  nuevo uuid := gen_random_uuid();
begin
  if not public.es_propietario() then
    raise exception 'Solo el propietario puede crear cuentas.';
  end if;

  if length(coalesce(p_clave, '')) < 10 then
    raise exception 'La contraseña debe tener al menos 10 caracteres.';
  end if;

  select * into ficha from public.empleados where id = p_empleado;
  if not found then
    raise exception 'Ese empleado no existe.';
  end if;
  if ficha.perfil_id is not null then
    raise exception 'Este empleado ya tiene cuenta.';
  end if;
  if exists (select 1 from auth.users where lower(email) = lower(ficha.email)) then
    raise exception 'Ya hay una cuenta con el email %.', ficha.email;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', nuevo, 'authenticated', 'authenticated',
    lower(ficha.email), extensions.crypt(p_clave, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombre', ficha.nombre),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), nuevo, nuevo::text,
    jsonb_build_object('sub', nuevo::text, 'email', lower(ficha.email), 'email_verified', true),
    'email', now(), now(), now()
  );

  -- Si un trigger del proyecto ya ha creado el perfil, solo se ajusta.
  insert into public.perfiles (id, email, nombre, rol)
  values (nuevo, lower(ficha.email), ficha.nombre, 'empleado')
  on conflict (id) do update set rol = 'empleado', nombre = excluded.nombre;

  update public.empleados set perfil_id = nuevo where id = p_empleado;
  return nuevo;
end;
$$;

create or replace function public.restablecer_clave_empleado(p_empleado uuid, p_clave text)
returns void
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  cuenta uuid;
begin
  if not public.es_propietario() then
    raise exception 'Solo el propietario puede cambiar contraseñas.';
  end if;
  if length(coalesce(p_clave, '')) < 10 then
    raise exception 'La contraseña debe tener al menos 10 caracteres.';
  end if;

  select perfil_id into cuenta from public.empleados where id = p_empleado;
  if cuenta is null then
    raise exception 'Este empleado no tiene cuenta.';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_clave, extensions.gen_salt('bf')),
         updated_at = now()
   where id = cuenta;
end;
$$;

-- Solo usuarios con sesión; dentro, cada función comprueba el rol.
revoke all on function public.fichar() from public, anon;
revoke all on function public.firmar_nomina(uuid, text) from public, anon;
revoke all on function public.completar_mi_tarea(uuid) from public, anon;
revoke all on function public.crear_cuenta_empleado(uuid, text) from public, anon;
revoke all on function public.restablecer_clave_empleado(uuid, text) from public, anon;
grant execute on function public.fichar() to authenticated;
grant execute on function public.firmar_nomina(uuid, text) to authenticated;
grant execute on function public.completar_mi_tarea(uuid) to authenticated;
grant execute on function public.crear_cuenta_empleado(uuid, text) to authenticated;
grant execute on function public.restablecer_clave_empleado(uuid, text) to authenticated;

-- --- 8. Archivos: nóminas (privado) y fotos del equipo (público) ----------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('nominas', 'nominas', false, 5242880, array['application/pdf']),
  ('fotos-equipo', 'fotos-equipo', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy nominas_archivos_propietario on storage.objects
  for all to authenticated
  using (bucket_id = 'nominas' and public.es_propietario())
  with check (bucket_id = 'nominas' and public.es_propietario());

-- El empleado solo puede descargar los PDF que figuran como suyos.
create policy nominas_archivos_propios on storage.objects
  for select to authenticated
  using (
    bucket_id = 'nominas'
    and exists (
      select 1 from public.nominas n
       where n.archivo = storage.objects.name
         and n.empleado_id = public.mi_empleado_id()
    )
  );

create policy fotos_equipo_propietario on storage.objects
  for all to authenticated
  using (bucket_id = 'fotos-equipo' and public.es_propietario())
  with check (bucket_id = 'fotos-equipo' and public.es_propietario());
