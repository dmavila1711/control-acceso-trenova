-- Fix: la creacion automatica de configuracion_fraccionamiento (trigger after
-- insert en fraccionamientos) violaba RLS, porque esa tabla solo tiene politicas
-- de SELECT/UPDATE y ninguna de INSERT. La creacion del registro de configuracion
-- es un invariante del sistema, asi que el trigger debe correr como SECURITY
-- DEFINER para saltarse RLS de forma controlada.
create or replace function public.ensure_fractionation_config()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.configuracion_fraccionamiento (fraccionamiento_id)
  values (new.id)
  on conflict (fraccionamiento_id) do nothing;
  return new;
end;
$$;
