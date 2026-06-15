-- Seed de demostracion. Los auth_user_id son placeholders: crea usuarios en Supabase Auth
-- y actualiza estos UUIDs con los IDs reales antes de operar.

insert into public.fraccionamientos (
  id,
  nombre,
  direccion,
  contacto_admin,
  email_contacto,
  estatus
) values (
  '10000000-0000-4000-8000-000000000001',
  'Trenova Demo',
  'Av. Principal 100, Ciudad Demo',
  'Administracion Trenova',
  'admin@trenova.demo',
  'ACTIVO'
) on conflict (id) do nothing;

insert into public.domicilios (
  id,
  fraccionamiento_id,
  calle,
  numero_exterior,
  numero_interior,
  referencia
) values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Circuito Roble',
  '42',
  null,
  'Frente al parque'
) on conflict (id) do nothing;

insert into public.perfiles_usuario (
  id,
  auth_user_id,
  fraccionamiento_id,
  domicilio_id,
  nombre,
  email,
  rol,
  estatus
) values
  (
    '30000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001',
    null,
    null,
    'Superadmin Demo',
    'superadmin@trenova.demo',
    'SUPERADMIN',
    'ACTIVO'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    null,
    'Administracion Demo',
    'admin@trenova.demo',
    'ADMINISTRACION',
    'ACTIVO'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '90000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    null,
    'Guardia Demo',
    'guardia@trenova.demo',
    'GUARDIA',
    'ACTIVO'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '90000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Colono Demo Uno',
    'colono1@trenova.demo',
    'COLONO',
    'ACTIVO'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '90000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Colono Demo Dos',
    'colono2@trenova.demo',
    'COLONO',
    'ACTIVO'
  )
on conflict (id) do nothing;

insert into public.avisos_generales (
  id,
  fraccionamiento_id,
  titulo,
  mensaje,
  prioridad,
  fecha_inicio,
  fecha_fin,
  created_by
) values (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Mantenimiento en acceso principal',
  'El acceso principal tendra mantenimiento preventivo. Usa el carril derecho.',
  'NORMAL',
  now() - interval '1 day',
  now() + interval '7 days',
  '30000000-0000-4000-8000-000000000002'
) on conflict (id) do nothing;

insert into public.invitaciones (
  id,
  fraccionamiento_id,
  domicilio_id,
  created_by,
  tipo_visita,
  nombre_visitante,
  tipo_autorizacion,
  fecha_inicio,
  fecha_fin,
  estatus,
  qr_token_hash,
  codigo_numerico_hash,
  codigo_numerico_last4,
  observaciones
) values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000004',
  'VISITA',
  'Visitante Demo',
  'UN_DIA',
  date_trunc('day', now()),
  date_trunc('day', now()) + interval '1 day' - interval '1 second',
  'VIGENTE',
  'seed-placeholder-qr-hash',
  'seed-placeholder-code-hash',
  '1234',
  'Invitacion demo no validable hasta crear una real desde la app.'
) on conflict (id) do nothing;
