-- Zona horaria por fraccionamiento. Aditivo e idempotente: seguro de aplicar
-- aunque ya se haya corrido 0001 (que ya incluye la columna en instalaciones
-- nuevas). Permite calcular los limites de dia/mes en la zona local.
alter table public.configuracion_fraccionamiento
  add column if not exists zona_horaria text not null default 'America/Mexico_City';
