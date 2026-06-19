-- Fase 1.2 — Hardening de seguridad.
-- 1) Tabla de eventos de seguridad (rate limiting, intentos invalidos, etc.).
-- 2) Auditoria y eventos de seguridad como append-only (sin UPDATE/DELETE).

create table if not exists public.eventos_seguridad (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid null references public.fraccionamientos(id) on delete set null,
  actor_user_id uuid null references public.perfiles_usuario(id) on delete set null,
  actor_role text null,
  event_type text not null,
  severity text not null default 'INFO' check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  entity_type text null,
  entity_id uuid null,
  metadata jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists eventos_seguridad_fracc_idx
  on public.eventos_seguridad(fraccionamiento_id, created_at desc);
create index if not exists eventos_seguridad_actor_idx
  on public.eventos_seguridad(actor_user_id, event_type, created_at desc);

alter table public.eventos_seguridad enable row level security;

-- Lectura: superadmin global; administracion solo su fraccionamiento.
-- La escritura del mecanismo de seguridad se hace server-side con service role
-- (que omite RLS), por eso no exponemos INSERT amplio a clientes.
drop policy if exists "eventos_seguridad_select_scoped" on public.eventos_seguridad;
create policy "eventos_seguridad_select_scoped"
on public.eventos_seguridad for select
using (
  public.is_superadmin()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id())
);

-- Append-only: bloquea UPDATE y DELETE en tablas de registro (incluido service role).
create or replace function public.deny_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Tabla de solo escritura (append-only): % no permitido.', tg_op;
end;
$$;

drop trigger if exists auditoria_no_update on public.auditoria;
drop trigger if exists auditoria_no_delete on public.auditoria;
create trigger auditoria_no_update before update on public.auditoria
  for each row execute function public.deny_mutation();
create trigger auditoria_no_delete before delete on public.auditoria
  for each row execute function public.deny_mutation();

drop trigger if exists eventos_seguridad_no_update on public.eventos_seguridad;
drop trigger if exists eventos_seguridad_no_delete on public.eventos_seguridad;
create trigger eventos_seguridad_no_update before update on public.eventos_seguridad
  for each row execute function public.deny_mutation();
create trigger eventos_seguridad_no_delete before delete on public.eventos_seguridad
  for each row execute function public.deny_mutation();
