-- Deshace 20261126120000_paginas_web.sql. Borra las páginas que hubiera.

drop table if exists public.paginas;
drop function if exists public.paginas_tocar();
