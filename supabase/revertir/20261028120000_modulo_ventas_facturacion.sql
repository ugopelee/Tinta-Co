-- Deshace 20261028120000_modulo_ventas_facturacion.sql, en orden inverso.
-- Borra también los datos de ventas, facturas y facturas de proveedor.
-- Los archivos del bucket hay que borrarlos antes desde el panel de Storage
-- (Supabase no deja borrar un bucket con objetos desde SQL).

drop policy if exists facturas_proveedor_archivos_propietario on storage.objects;
delete from storage.buckets where id = 'facturas-proveedor';

drop table if exists public.facturas_proveedor;
drop table if exists public.lineas_factura;
drop table if exists public.facturas;
drop table if exists public.lineas_venta;
drop table if exists public.ventas;

drop function if exists public.facturar_venta(uuid);
drop function if exists public.proteger_factura();
drop function if exists public.controlar_venta();
drop function if exists public.proteger_lineas_venta();
drop function if exists public.numerar_venta();
drop function if exists public.siguiente_numero(text);

drop table if exists public.series;
