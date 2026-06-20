-- Fase 1.4 (restante): segmentacion de avisos generales.
-- Idempotente: se puede reaplicar sin error. No modifica RLS (la visibilidad por
-- segmento se aplica en la capa de query server-side; el aislamiento por
-- fraccionamiento sigue garantizado por las politicas existentes).

-- Columnas de segmentacion. Los avisos existentes quedan como 'TODOS' (default),
-- conservando compatibilidad con el comportamiento anterior.
alter table public.avisos_generales
  add column if not exists segmento text not null default 'TODOS';

alter table public.avisos_generales
  add column if not exists segmento_calle text null;

alter table public.avisos_generales
  add column if not exists segmento_domicilio_id uuid null
    references public.domicilios(id) on delete cascade;

-- Valores permitidos para segmento.
alter table public.avisos_generales
  drop constraint if exists avisos_segmento_check;
alter table public.avisos_generales
  add constraint avisos_segmento_check
  check (segmento in ('TODOS', 'COLONOS', 'GUARDIAS', 'ADMINISTRACION', 'CALLE', 'DOMICILIO'));

-- Coherencia: CALLE requiere calle; DOMICILIO requiere domicilio; el resto no
-- debe traer objetivo especifico.
alter table public.avisos_generales
  drop constraint if exists avisos_segmento_target_check;
alter table public.avisos_generales
  add constraint avisos_segmento_target_check
  check (
    (segmento = 'CALLE' and segmento_calle is not null and segmento_domicilio_id is null)
    or (segmento = 'DOMICILIO' and segmento_domicilio_id is not null and segmento_calle is null)
    or (segmento in ('TODOS', 'COLONOS', 'GUARDIAS', 'ADMINISTRACION')
        and segmento_calle is null and segmento_domicilio_id is null)
  );

create index if not exists avisos_segmento_idx
  on public.avisos_generales(fraccionamiento_id, estatus, segmento);
