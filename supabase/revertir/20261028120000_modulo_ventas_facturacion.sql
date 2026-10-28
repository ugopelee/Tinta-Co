-- Deshace 20261028120000_modulo_ventas_facturacion.sql, en orden inverso.
-- Borra también los datos de ventas, facturas y facturas de proveedor.
-- Supabase no deja borrar buckets ni sus objetos con SQL (`delete from
-- storage.buckets` falla): antes o después de ejecutar este script hay que
-- vaciar y borrar el bucket «facturas-proveedor» desde el panel de Storage o
-- con la API de Storage. Aquí solo se quita su política.

drop policy if exists facturas_proveedor_archivos_propietario on storage.objects;

drop table if exists public.facturas_proveedor;
drop table if exists public.lineas_factura;
drop table if exists public.facturas;
drop table if exists public.lineas_venta;
drop table if exists public.ventas;

drop function if exists public.resumen_facturacion();
drop function if exists public.guardar_venta(uuid, uuid, uuid, date, text, jsonb);
drop function if exists public.facturar_venta(uuid);
drop function if exists public.proteger_factura();
drop function if exists public.controlar_venta();
drop function if exists public.proteger_lineas_venta();
drop function if exists public.numerar_venta();
drop function if exists public.siguiente_numero(text);

drop table if exists public.series;
