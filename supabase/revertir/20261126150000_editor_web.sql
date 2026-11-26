-- Deshace 20261126150000_editor_web.sql. Las fotos que hubiera en el bucket
-- «web» se vacían a mano desde Storage antes de borrarlo (Supabase no deja
-- borrar un bucket con archivos).

drop policy if exists web_fotos_sube on storage.objects;
drop policy if exists web_fotos_borra on storage.objects;
delete from storage.buckets where id = 'web';

drop table if exists public.web_publicaciones;
drop table if exists public.web_sitio;
