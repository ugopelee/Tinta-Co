-- =====================================================================
-- Editor de la web (Tinta&Co)
--
-- Dos filas en web_sitio:
--   · borrador  → lo que el propietario edita en /web del CRM (solo él lo ve)
--   · publicado → lo que se ve en la web pública (lo lee cualquiera)
-- `datos` es el JSON del tipo Sitio (packages/compartido/src/web/esquema.ts).
--
-- Bucket público «web» para las fotos que se suben desde el editor.
-- Depende de `es_propietario()` (20261002120000_modulo_rrhh.sql). Se puede
-- ejecutar varias veces; se deshace con
-- `supabase/revertir/20261126150000_editor_web.sql`.
-- =====================================================================

create table if not exists public.web_sitio (
  estado text primary key check (estado in ('borrador', 'publicado')),
  datos jsonb not null,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users (id) on delete set null default auth.uid()
);

alter table public.web_sitio enable row level security;

-- La web pública lee solo la fila publicada, sin sesión.
drop policy if exists web_sitio_lee_publicado on public.web_sitio;
create policy web_sitio_lee_publicado on public.web_sitio
  for select to anon, authenticated using (estado = 'publicado');

-- El borrador y cualquier escritura, solo el propietario.
drop policy if exists web_sitio_lee_borrador on public.web_sitio;
create policy web_sitio_lee_borrador on public.web_sitio
  for select to authenticated using (public.es_propietario());

drop policy if exists web_sitio_crea on public.web_sitio;
create policy web_sitio_crea on public.web_sitio
  for insert to authenticated with check (public.es_propietario());

drop policy if exists web_sitio_edita on public.web_sitio;
create policy web_sitio_edita on public.web_sitio
  for update to authenticated
  using (public.es_propietario()) with check (public.es_propietario());

-- Historial de publicaciones, para volver a una versión anterior si hace falta.
create table if not exists public.web_publicaciones (
  id bigint generated always as identity primary key,
  datos jsonb not null,
  publicado_en timestamptz not null default now(),
  publicado_por uuid references auth.users (id) on delete set null default auth.uid()
);
create index if not exists web_publicaciones_fecha_idx
  on public.web_publicaciones (publicado_en desc);

alter table public.web_publicaciones enable row level security;

drop policy if exists web_publicaciones_ve on public.web_publicaciones;
create policy web_publicaciones_ve on public.web_publicaciones
  for select to authenticated using (public.es_propietario());

drop policy if exists web_publicaciones_registra on public.web_publicaciones;
create policy web_publicaciones_registra on public.web_publicaciones
  for insert to authenticated with check (public.es_propietario());

-- Fotos de la web: lectura pública, subida y borrado solo del propietario.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('web', 'web', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists web_fotos_sube on storage.objects;
create policy web_fotos_sube on storage.objects
  for insert to authenticated
  with check (bucket_id = 'web' and public.es_propietario());

drop policy if exists web_fotos_borra on storage.objects;
create policy web_fotos_borra on storage.objects
  for delete to authenticated
  using (bucket_id = 'web' and public.es_propietario());
