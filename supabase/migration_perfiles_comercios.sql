-- Conecta Virasoro: campos para perfiles completos de comercios
-- Ejecutar una sola vez en Supabase > SQL Editor.
alter table public.publicaciones
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists tiktok_url text,
  add column if not exists website_url text;

