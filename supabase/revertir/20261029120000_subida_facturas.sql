-- Deshace 20261029120000_subida_facturas.sql. Los originales que quedaran en
-- `entrada/` del bucket «facturas-proveedor» se borran a mano desde Storage.

drop table if exists public.facturas_entrantes;
