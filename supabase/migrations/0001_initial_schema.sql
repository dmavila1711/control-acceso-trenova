create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.fraccionamientos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text null,
  contacto_admin text null,
  email_contacto text null,
  estatus text not null default 'EN_CONFIGURACION'
    check (estatus in ('ACTIVO', 'SUSPENDIDO', 'EN_CONFIGURACION', 'INACTIVO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  suspended_at timestamptz null,
  suspended_by uuid null,
  suspension_reason text null
);

create table public.domicilios (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid not null references public.fraccionamientos(id) on delete cascade,
  calle text not null,
  numero_exterior text not null,
  numero_interior text null,
  referencia text null,
  estatus text not null default 'ACTIVO'
    check (estatus in ('ACTIVO', 'INACTIVO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.perfiles_usuario (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  fraccionamiento_id uuid null references public.fraccionamientos(id) on delete restrict,
  domicilio_id uuid null references public.domicilios(id) on delete restrict,
  nombre text not null,
  email text not null,
  rol text not null
    check (rol in ('SUPERADMIN', 'ADMINISTRACION', 'GUARDIA', 'COLONO')),
  estatus text not null default 'ACTIVO'
    check (estatus in ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz null,
  deactivated_by uuid null references public.perfiles_usuario(id) on delete set null,
  constraint perfiles_usuario_email_required check (length(trim(email)) > 3),
  constraint perfiles_usuario_scope check (
    (rol = 'SUPERADMIN' and fraccionamiento_id is null and domicilio_id is null)
    or (rol = 'COLONO' and fraccionamiento_id is not null and domicilio_id is not null)
    or (rol in ('ADMINISTRACION', 'GUARDIA') and fraccionamiento_id is not null and domicilio_id is null)
  )
);

create table public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid not null references public.fraccionamientos(id) on delete cascade,
  domicilio_id uuid not null references public.domicilios(id) on delete cascade,
  created_by uuid not null references public.perfiles_usuario(id) on delete restrict,
  tipo_visita text not null
    check (tipo_visita in ('VISITA', 'TRANSPORTE', 'PAQUETERIA_MENSAJERIA', 'SERVICIO_PROVEEDOR', 'OTRO')),
  nombre_visitante text not null,
  empresa text null,
  telefono_visitante text null,
  placas text null,
  tipo_autorizacion text not null
    check (tipo_autorizacion in ('UN_DIA', 'HOY_MANANA', 'VISITA_FRECUENTE', 'EN_CASETA')),
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,
  estatus text not null default 'VIGENTE'
    check (estatus in ('VIGENTE', 'USADA', 'CANCELADA', 'EXPIRADA', 'RECHAZADA_EN_CASETA')),
  qr_token_hash text not null,
  codigo_numerico_hash text not null,
  qr_token_ciphertext text null,
  codigo_numerico_ciphertext text null,
  codigo_numerico_last4 text null,
  observaciones text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz null,
  cancelled_by uuid null references public.perfiles_usuario(id) on delete set null,
  constraint invitaciones_fecha_valida check (fecha_fin >= fecha_inicio)
);

create table public.accesos (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid not null references public.fraccionamientos(id) on delete cascade,
  domicilio_id uuid null references public.domicilios(id) on delete set null,
  invitacion_id uuid null references public.invitaciones(id) on delete set null,
  guardia_id uuid not null references public.perfiles_usuario(id) on delete restrict,
  nombre_visitante text null,
  tipo_visita text null
    check (tipo_visita is null or tipo_visita in ('VISITA', 'TRANSPORTE', 'PAQUETERIA_MENSAJERIA', 'SERVICIO_PROVEEDOR', 'OTRO')),
  metodo_validacion text not null
    check (metodo_validacion in ('QR', 'CODIGO_NUMERICO', 'BUSQUEDA_MANUAL', 'SIN_INVITACION')),
  resultado text not null
    check (resultado in ('PERMITIDO', 'RECHAZADO', 'INVITACION_EXPIRADA', 'INVITACION_CANCELADA', 'INVITACION_NO_ENCONTRADA', 'DOMICILIO_INACTIVO', 'FRACCIONAMIENTO_SUSPENDIDO', 'OTRO')),
  observaciones text null,
  arrived_at timestamptz not null default now(),
  resolved_at timestamptz null,
  created_at timestamptz not null default now()
);

create table public.avisos_generales (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid not null references public.fraccionamientos(id) on delete cascade,
  titulo text not null,
  mensaje text not null,
  prioridad text not null default 'NORMAL'
    check (prioridad in ('BAJA', 'NORMAL', 'ALTA')),
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,
  estatus text not null default 'ACTIVO'
    check (estatus in ('ACTIVO', 'INACTIVO')),
  created_by uuid not null references public.perfiles_usuario(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint avisos_fecha_valida check (fecha_fin > fecha_inicio)
);

create table public.mensajes_administrativos (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid not null references public.fraccionamientos(id) on delete cascade,
  sender_id uuid not null references public.perfiles_usuario(id) on delete restrict,
  recipient_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  titulo text not null,
  mensaje text not null,
  canal text not null default 'INTERNO'
    check (canal in ('INTERNO', 'EMAIL', 'WHATSAPP', 'PUSH')),
  estatus text not null default 'ENVIADO'
    check (estatus in ('ENVIADO', 'LEIDO', 'FALLIDO', 'PENDIENTE')),
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid null references public.fraccionamientos(id) on delete set null,
  actor_user_id uuid null references public.perfiles_usuario(id) on delete set null,
  actor_role text null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  domicilio_id uuid null references public.domicilios(id) on delete set null,
  metadata jsonb null,
  previous_values jsonb null,
  new_values jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create table public.configuracion_fraccionamiento (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid unique not null references public.fraccionamientos(id) on delete cascade,
  max_usuarios_por_domicilio int not null default 2 check (max_usuarios_por_domicilio between 1 and 10),
  permite_compartir_whatsapp boolean not null default true,
  requiere_email_usuario boolean not null default true,
  zona_horaria text not null default 'America/Mexico_City',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.eventos_mensaje (
  id uuid primary key default gen_random_uuid(),
  fraccionamiento_id uuid null references public.fraccionamientos(id) on delete set null,
  mensaje_id uuid null references public.mensajes_administrativos(id) on delete set null,
  canal text not null check (canal in ('INTERNO', 'EMAIL', 'WHATSAPP', 'PUSH')),
  evento text not null,
  estatus text not null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index domicilios_fraccionamiento_idx on public.domicilios(fraccionamiento_id);
create index perfiles_fraccionamiento_idx on public.perfiles_usuario(fraccionamiento_id);
create index perfiles_domicilio_idx on public.perfiles_usuario(domicilio_id);
create index invitaciones_fraccionamiento_idx on public.invitaciones(fraccionamiento_id, estatus, fecha_inicio);
create index invitaciones_domicilio_idx on public.invitaciones(domicilio_id, estatus);
create index invitaciones_qr_hash_idx on public.invitaciones(qr_token_hash);
create index invitaciones_codigo_hash_idx on public.invitaciones(codigo_numerico_hash);
create index accesos_fraccionamiento_idx on public.accesos(fraccionamiento_id, arrived_at desc);
create index accesos_domicilio_idx on public.accesos(domicilio_id, arrived_at desc);
create index avisos_vigencia_idx on public.avisos_generales(fraccionamiento_id, estatus, fecha_inicio, fecha_fin);
create index mensajes_recipient_idx on public.mensajes_administrativos(recipient_id, created_at desc);
create index auditoria_fraccionamiento_idx on public.auditoria(fraccionamiento_id, created_at desc);

create trigger fraccionamientos_touch_updated_at
before update on public.fraccionamientos
for each row execute function public.touch_updated_at();

create trigger domicilios_touch_updated_at
before update on public.domicilios
for each row execute function public.touch_updated_at();

create trigger perfiles_usuario_touch_updated_at
before update on public.perfiles_usuario
for each row execute function public.touch_updated_at();

create trigger invitaciones_touch_updated_at
before update on public.invitaciones
for each row execute function public.touch_updated_at();

create trigger avisos_generales_touch_updated_at
before update on public.avisos_generales
for each row execute function public.touch_updated_at();

create trigger configuracion_fraccionamiento_touch_updated_at
before update on public.configuracion_fraccionamiento
for each row execute function public.touch_updated_at();

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

create trigger fraccionamientos_create_config
after insert on public.fraccionamientos
for each row execute function public.ensure_fractionation_config();

create or replace function public.enforce_colono_limit()
returns trigger
language plpgsql
as $$
declare
  active_count int;
  configured_limit int;
  target_fractionation uuid;
begin
  if new.rol = 'COLONO' and new.estatus = 'ACTIVO' then
    if new.domicilio_id is null then
      raise exception 'COLONO requiere domicilio_id';
    end if;

    select d.fraccionamiento_id
      into target_fractionation
      from public.domicilios d
      where d.id = new.domicilio_id;

    select coalesce(c.max_usuarios_por_domicilio, 2)
      into configured_limit
      from public.configuracion_fraccionamiento c
      where c.fraccionamiento_id = target_fractionation;

    select count(*)
      into active_count
      from public.perfiles_usuario p
      where p.domicilio_id = new.domicilio_id
        and p.rol = 'COLONO'
        and p.estatus = 'ACTIVO'
        and p.id <> coalesce(new.id, gen_random_uuid());

    if active_count >= coalesce(configured_limit, 2) then
      raise exception 'No se permite mas de % colonos activos por domicilio', coalesce(configured_limit, 2);
    end if;
  end if;

  return new;
end;
$$;

create trigger perfiles_usuario_colono_limit
before insert or update of rol, estatus, domicilio_id on public.perfiles_usuario
for each row execute function public.enforce_colono_limit();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.perfiles_usuario p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.rol
  from public.perfiles_usuario p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_fraccionamiento_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.fraccionamiento_id
  from public.perfiles_usuario p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_domicilio_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.domicilio_id
  from public.perfiles_usuario p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles_usuario p
    where p.auth_user_id = auth.uid()
      and p.rol = 'SUPERADMIN'
      and p.estatus = 'ACTIVO'
  );
$$;

alter table public.fraccionamientos enable row level security;
alter table public.domicilios enable row level security;
alter table public.perfiles_usuario enable row level security;
alter table public.invitaciones enable row level security;
alter table public.accesos enable row level security;
alter table public.avisos_generales enable row level security;
alter table public.mensajes_administrativos enable row level security;
alter table public.auditoria enable row level security;
alter table public.configuracion_fraccionamiento enable row level security;
alter table public.eventos_mensaje enable row level security;

create policy "fraccionamientos_select_tenant_or_superadmin"
on public.fraccionamientos for select
using (public.is_superadmin() or id = public.current_fraccionamiento_id());

create policy "fraccionamientos_write_superadmin"
on public.fraccionamientos for all
using (public.is_superadmin())
with check (public.is_superadmin());

create policy "domicilios_select_scoped"
on public.domicilios for select
using (
  public.is_superadmin()
  or fraccionamiento_id = public.current_fraccionamiento_id()
  or id = public.current_domicilio_id()
);

create policy "domicilios_admin_write"
on public.domicilios for all
using (public.is_superadmin() or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id()))
with check (public.is_superadmin() or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id()));

create policy "perfiles_select_scoped"
on public.perfiles_usuario for select
using (
  public.is_superadmin()
  or id = public.current_profile_id()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id())
  or (rol = 'COLONO' and domicilio_id = public.current_domicilio_id())
);

create policy "perfiles_admin_write"
on public.perfiles_usuario for all
using (
  public.is_superadmin()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id() and rol <> 'SUPERADMIN')
)
with check (
  public.is_superadmin()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id() and rol <> 'SUPERADMIN')
);

create policy "invitaciones_select_scoped"
on public.invitaciones for select
using (
  public.is_superadmin()
  or (public.current_role() in ('ADMINISTRACION', 'GUARDIA') and fraccionamiento_id = public.current_fraccionamiento_id())
  or (public.current_role() = 'COLONO' and domicilio_id = public.current_domicilio_id())
);

create policy "invitaciones_insert_colono_or_admin"
on public.invitaciones for insert
with check (
  public.is_superadmin()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id())
  or (public.current_role() = 'COLONO' and domicilio_id = public.current_domicilio_id())
);

create policy "invitaciones_update_cancel_scoped"
on public.invitaciones for update
using (
  public.is_superadmin()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id())
  or (public.current_role() = 'COLONO' and domicilio_id = public.current_domicilio_id())
  or (public.current_role() = 'GUARDIA' and fraccionamiento_id = public.current_fraccionamiento_id())
)
with check (
  public.is_superadmin()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id())
  or (public.current_role() = 'COLONO' and domicilio_id = public.current_domicilio_id())
  or (public.current_role() = 'GUARDIA' and fraccionamiento_id = public.current_fraccionamiento_id())
);

create policy "accesos_select_scoped"
on public.accesos for select
using (
  public.is_superadmin()
  or (public.current_role() in ('ADMINISTRACION', 'GUARDIA') and fraccionamiento_id = public.current_fraccionamiento_id())
  or (public.current_role() = 'COLONO' and domicilio_id = public.current_domicilio_id())
);

create policy "accesos_insert_guardia_admin"
on public.accesos for insert
with check (
  public.is_superadmin()
  or (public.current_role() in ('ADMINISTRACION', 'GUARDIA') and fraccionamiento_id = public.current_fraccionamiento_id())
);

create policy "avisos_select_activos_scoped"
on public.avisos_generales for select
using (
  public.is_superadmin()
  or fraccionamiento_id = public.current_fraccionamiento_id()
);

create policy "avisos_admin_write"
on public.avisos_generales for all
using (public.is_superadmin() or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id()))
with check (public.is_superadmin() or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id()));

create policy "mensajes_select_sender_recipient_or_admin"
on public.mensajes_administrativos for select
using (
  public.is_superadmin()
  or sender_id = public.current_profile_id()
  or recipient_id = public.current_profile_id()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id())
);

create policy "mensajes_admin_insert"
on public.mensajes_administrativos for insert
with check (
  public.is_superadmin()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id())
);

create policy "mensajes_recipient_update_read"
on public.mensajes_administrativos for update
using (recipient_id = public.current_profile_id())
with check (recipient_id = public.current_profile_id());

create policy "auditoria_select_scoped"
on public.auditoria for select
using (
  public.is_superadmin()
  or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id())
);

create policy "auditoria_insert_authenticated"
on public.auditoria for insert
with check (auth.uid() is not null);

create policy "configuracion_select_scoped"
on public.configuracion_fraccionamiento for select
using (
  public.is_superadmin()
  or fraccionamiento_id = public.current_fraccionamiento_id()
);

create policy "configuracion_write_superadmin_or_admin"
on public.configuracion_fraccionamiento for update
using (public.is_superadmin() or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id()))
with check (public.is_superadmin() or (public.current_role() = 'ADMINISTRACION' and fraccionamiento_id = public.current_fraccionamiento_id()));

create policy "eventos_mensaje_select_scoped"
on public.eventos_mensaje for select
using (
  public.is_superadmin()
  or fraccionamiento_id = public.current_fraccionamiento_id()
);

create policy "eventos_mensaje_insert_authenticated"
on public.eventos_mensaje for insert
with check (auth.uid() is not null);

comment on table public.invitaciones is 'QR y codigo numerico se guardan hasheados para busqueda y cifrados server-side para re-mostrar al colono. Nunca se guardan en texto plano.';
comment on policy "perfiles_admin_write" on public.perfiles_usuario is 'TODO security-hardening: dividir insert/update por rol para reglas mas granulares de activacion.';
comment on policy "invitaciones_update_cancel_scoped" on public.invitaciones is 'TODO security-hardening: limitar columnas modificables por rol mediante RPCs dedicadas.';
