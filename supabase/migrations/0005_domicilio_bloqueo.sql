-- Fase 1.4 — Bloqueo de invitaciones por domicilio.
-- Agrega el estatus BLOQUEADO_PARA_INVITACIONES: el domicilio no puede generar
-- nuevas invitaciones, pero su historial sigue consultable y las invitaciones
-- existentes pueden seguir validandose en caseta.
alter table public.domicilios
  drop constraint if exists domicilios_estatus_check;

alter table public.domicilios
  add constraint domicilios_estatus_check
  check (estatus in ('ACTIVO', 'INACTIVO', 'BLOQUEADO_PARA_INVITACIONES'));
