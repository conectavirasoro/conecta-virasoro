-- Conecta Virasoro: almacenamiento público de logos comerciales
-- Ejecutar una sola vez en Supabase > SQL Editor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos-comercios', 'logos-comercios', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Logos comerciales visibles publicamente" on storage.objects;
create policy "Logos comerciales visibles publicamente"
on storage.objects for select
to public
using (bucket_id = 'logos-comercios');

drop policy if exists "Cualquiera puede cargar logos comerciales" on storage.objects;
create policy "Cualquiera puede cargar logos comerciales"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'logos-comercios'
  and (storage.foldername(name))[1] = 'comercios'
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp')
  and (metadata->>'mimetype') in ('image/jpeg','image/png','image/webp')
  and (metadata->>'size')::bigint <= 3145728
);
