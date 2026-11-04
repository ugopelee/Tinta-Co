-- Deshace `datos_prueba.sql`: borra todo lo que lleva un email de prueba.test y
-- deja los contadores de numeración donde estaban sin esos datos.

begin;

-- Facturas y ventas antes que sus clientes (las claves no van en cascada).
delete from public.facturas
 where cliente_id in (select id from public.clientes where email like '%@prueba.test');
delete from public.ventas
 where cliente_id in (select id from public.clientes where email like '%@prueba.test');
-- Las propuestas usan subdominios (empresa.prueba.test).
delete from public.citas where email like '%prueba.test';
delete from public.clientes where email like '%@prueba.test';
-- Fichajes, vacaciones y demás van en cascada.
delete from public.empleados where email like '%@prueba.test';
-- Cuentas del CRM creadas para esos empleados (el perfil va en cascada).
delete from auth.users where email like '%@prueba.test';

-- El siguiente número vuelve a ser el que toca tras el último que queda.
update public.series s
   set ultimo = coalesce((
     select max(split_part(numero, '-', 3)::int) from (
       select numero from public.facturas
       union all
       select numero from public.ventas
     ) n
     where n.numero like s.clave || '-%'
   ), 0);

commit;
