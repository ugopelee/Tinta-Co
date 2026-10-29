-- =====================================================================
-- Selección de personal de Tinta&Co
--
-- Procesos de admisión: cada candidato entra con su CV en PDF y avanza
-- por fases (nuevo → entrevista → oferta). Al contratarlo, el CRM crea su
-- ficha de empleado con el mismo email, la checklist de incorporación y su
-- cuenta de acceso (lo mismo que un alta a mano).
--
-- Depende de `20261002120000_modulo_rrhh.sql`. Se pega entera en el
-- editor SQL de Supabase.
-- =====================================================================

create table public.candidatos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono text,
  puesto text not null,
  departamento text,
  -- Ruta dentro del bucket privado «cvs».
  cv text not null,
  notas text,
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'entrevista', 'oferta', 'contratado', 'descartado')),
  -- La ficha que nació al contratarlo.
  empleado_id uuid references public.empleados (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidatos_por_estado on public.candidatos (estado, created_at desc);

-- Son datos personales de gente que aún no es del equipo: solo el propietario.
alter table public.candidatos enable row level security;

create policy candidatos_propietario on public.candidatos
  for all using (public.es_propietario()) with check (public.es_propietario());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy cvs_archivos_propietario on storage.objects
  for all to authenticated
  using (bucket_id = 'cvs' and public.es_propietario())
  with check (bucket_id = 'cvs' and public.es_propietario());
