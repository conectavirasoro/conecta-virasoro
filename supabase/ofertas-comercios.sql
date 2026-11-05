-- Vincula cada oferta con el perfil de un comercio aprobado.
-- Ejecutar una sola vez en Supabase > SQL Editor > New query.

alter table public.publicaciones
add column if not exists comercio_id bigint
references public.publicaciones(id) on delete set null;

create index if not exists publicaciones_comercio_id_idx
on public.publicaciones(comercio_id);

-- Valida que las ofertas públicas solo puedan vincularse a comercios aprobados.
create or replace function public.validar_comercio_de_oferta()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.categoria = 'ofertas' and new.comercio_id is not null
     and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    if not exists (
      select 1
      from public.publicaciones p
      where p.id = new.comercio_id
        and p.categoria = 'comercios'
        and p.estado = 'aprobada'
    ) then
      raise exception 'Solo podés vincular una oferta con un comercio aprobado.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validar_comercio_de_oferta on public.publicaciones;
create trigger validar_comercio_de_oferta
before insert or update of comercio_id, categoria
on public.publicaciones
for each row execute function public.validar_comercio_de_oferta();
