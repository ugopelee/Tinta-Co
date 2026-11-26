-- Deshace 20261126130000_paginas_tema.sql. Se pierden tema, secciones, SEO
-- y menú de las páginas; `contenido` vuelve vacío.

alter table public.paginas
  add column contenido jsonb not null default '{}'::jsonb
    check (jsonb_typeof(contenido) = 'object'),
  drop column if exists tema,
  drop column if exists secciones,
  drop column if exists descripcion,
  drop column if exists en_menu;
