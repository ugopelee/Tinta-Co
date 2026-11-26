-- =====================================================================
-- Páginas web editables desde el CRM
--
-- Un gestor de contenidos mínimo: cada fila es una página de la web
-- pública (`/p/<slug>`) hecha con una plantilla. Los campos de cada
-- plantilla viven en `@tinta/compartido/paginas`; aquí se guardan como
-- un objeto JSON en `contenido`, así que una plantilla nueva no pide
-- migración. Las páginas nacen sin publicar.
--
-- Depende de `es_propietario()`. Se pega entera en el editor SQL de
-- Supabase; se deshace con `supabase/revertir/20261126120000_paginas_web.sql`.
-- =====================================================================

create table public.paginas (
  id uuid primary key default gen_random_uuid(),
  -- La dirección pública: minúsculas, números y guiones sueltos.
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  titulo text not null check (char_length(titulo) between 1 and 120),
  plantilla text not null,
  contenido jsonb not null default '{}'::jsonb
    check (jsonb_typeof(contenido) = 'object'),
  publicada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.paginas_tocar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger paginas_tocar
  before update on public.paginas
  for each row execute function public.paginas_tocar();

-- El público solo ve lo publicado; el propietario lo gestiona todo.
alter table public.paginas enable row level security;

create policy paginas_lectura_publica on public.paginas
  for select to anon, authenticated using (publicada);

create policy paginas_gestion_propietario on public.paginas
  for all to authenticated
  using (public.es_propietario()) with check (public.es_propietario());
