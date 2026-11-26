-- =====================================================================
-- Páginas web como documentos: tema, secciones, SEO y menú
--
-- Cada página pasa a ser una lista ordenada de secciones independiente de
-- la plantilla (que ahora solo decide el aspecto), más su tema (paleta y
-- retoques de color y tipografía), una descripción para buscadores y si
-- sale en el menú de las páginas. La forma de `tema` y `secciones` la
-- valida el CRM con `@tinta/compartido/paginas`; aquí solo el tipo JSON.
-- `contenido` (campos fijos por plantilla) se sustituye por `secciones`.
--
-- Depende de `20261126120000_paginas_web.sql`. Se deshace con
-- `supabase/revertir/20261126130000_paginas_tema.sql`.
-- =====================================================================

alter table public.paginas
  add column tema jsonb not null default '{}'::jsonb
    check (jsonb_typeof(tema) = 'object'),
  add column secciones jsonb not null default '[]'::jsonb
    check (jsonb_typeof(secciones) = 'array'),
  add column descripcion text check (char_length(descripcion) <= 160),
  add column en_menu boolean not null default false,
  drop column contenido;
