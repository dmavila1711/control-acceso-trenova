# Control de Acceso Trenova

PWA multitenant para fraccionamientos privados. Permite crear invitaciones, validar accesos por QR o codigo numerico, registrar eventos de caseta, administrar domicilios/usuarios/avisos/mensajes y operar multiples fraccionamientos desde un superadmin.

## Stack

- Next.js App Router
- TypeScript estricto
- Supabase Auth, PostgreSQL y SSR client
- Row Level Security por fraccionamiento y domicilio
- Tailwind CSS
- Zod y React Hook Form preparado
- QR con `qrcode`
- Escaneo QR con `html5-qrcode`
- PWA basica con manifest y service worker
- Vitest preparado para pruebas

## Estructura principal

```txt
src/
  app/                  Rutas por rol: app, caseta, admin, superadmin
  components/           UI reutilizable, layout, QR y scanner
  features/             Flujos de auth, invitaciones y accesos
  lib/
    auth/               Sesion y redireccion por rol
    audit/              auditAction()
    qr/                 Tokens, HMAC y cifrado server-side
    repositories/       Interfaces y adaptador Supabase
    security/           Guards de rol, tenant y domicilio
    services/           Logica de dominio
    supabase/           Clientes browser/server/admin
    validators/         Esquemas Zod
  server/
    actions/            Server actions seguras
    queries/            Queries server-side para dashboards/listados
  types/                Tipos de dominio y Database
supabase/
  migrations/           SQL inicial con RLS
  seed.sql              Seed demo
```

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Copia variables:

```bash
cp .env.example .env.local
```

3. Crea un proyecto en Supabase y completa:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=http://localhost:3000
QR_SECRET=
NUMERIC_CODE_SECRET=
```

Usa secretos largos y aleatorios para `QR_SECRET` y `NUMERIC_CODE_SECRET`.

4. Ejecuta migraciones en Supabase. Opciones:

```bash
supabase db push
```

O pega el contenido de `supabase/migrations/0001_initial_schema.sql` en el SQL editor de Supabase.

5. Opcional: carga datos demo:

```bash
supabase db reset
```

O ejecuta `supabase/seed.sql` en el SQL editor.

6. Levanta la app:

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Crear usuarios (Auth + perfil)

Supabase Auth crea los usuarios fuera de las tablas de dominio, asi que cada
usuario necesita un registro en `auth.users` y su perfil en `perfiles_usuario`
vinculados por `auth_user_id`. La forma recomendada es el script de setup, que
hace ambos pasos en una sola operacion usando la `SUPABASE_SERVICE_ROLE_KEY`.

### Opcion A (recomendada): script de setup

Requiere `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

Primer superadmin:

```bash
npm run crear-usuario -- \
  --email superadmin@tu-dominio.com \
  --password "ClaveSegura123" \
  --nombre "Superadmin" \
  --rol SUPERADMIN
```

Administrador / guardia (requieren fraccionamiento):

```bash
npm run crear-usuario -- --email admin@tu-dominio.com --password "Clave123" \
  --nombre "Administracion" --rol ADMINISTRACION --fraccionamiento <uuid-fraccionamiento>
```

Colono (requiere fraccionamiento y domicilio):

```bash
npm run crear-usuario -- --email colono@tu-dominio.com --password "Clave123" \
  --nombre "Colono" --rol COLONO --fraccionamiento <uuid> --domicilio <uuid>
```

El script es idempotente: si el usuario Auth ya existe, reutiliza su id y
actualiza el perfil. Tras crearlo, inicia sesion en `/login` y seras redirigido
al panel segun el rol.

### Opcion B (manual)

1. En Supabase, crea un usuario Auth con email y contrasena.
2. Copia su UUID de `auth.users.id`.
3. Inserta el perfil:

```sql
insert into public.perfiles_usuario (auth_user_id, nombre, email, rol, estatus)
values ('<uuid-auth-user>', 'Superadmin', 'superadmin@tu-dominio.com', 'SUPERADMIN', 'ACTIVO');
```

Para administradores, guardias y colonos puedes tambien crear el usuario Auth y
luego su perfil desde `/admin/usuarios`.

> Nota sobre el seed: `supabase/seed.sql` inserta perfiles demo con
> `auth_user_id` ficticios para poblar pantallas. Esos perfiles **no pueden
> iniciar sesion** hasta que existan usuarios Auth reales con esos UUID. Para
> una demo operable, crea los usuarios con el script y omite/ajusta el seed.

## Seguridad implementada

- RLS activado en tablas sensibles.
- Politicas base por fraccionamiento.
- Colonos limitados a su domicilio.
- Guardias y administracion limitados a su fraccionamiento.
- Superadmin global.
- `SUPABASE_SERVICE_ROLE_KEY` solo server-side.
- Server actions para operaciones sensibles.
- Hash HMAC para QR y codigo numerico.
- Cifrado server-side de QR/codigo para re-mostrar al colono sin guardar texto plano.
- Auditoria centralizada en `auditAction()`.
- Trigger SQL para maximo de colonos activos por domicilio.

## Flujos

### Auth

- `/login` inicia sesion con Supabase Auth.
- Redireccion por rol:
  - `SUPERADMIN` -> `/superadmin`
  - `ADMINISTRACION` -> `/admin`
  - `GUARDIA` -> `/caseta`
  - `COLONO` -> `/app`
- Usuarios inactivos son bloqueados.

### Invitacion

1. Colono crea invitacion en `/app/invitaciones/nueva`.
2. El servidor valida Zod, tenant, domicilio y fraccionamiento activo.
3. Se generan token QR y codigo de 6 digitos.
4. Se guardan hashes para validacion y ciphertext para re-mostrar.
5. Se audita `INVITACION_CREAR`.

### Caseta

- `/caseta/escanear` valida QR con camara.
- `/caseta/codigo` valida codigo numerico.
- `/caseta/buscar` busca invitaciones vigentes y registra intentos no encontrados.
- Permitir o rechazar crea registro en `accesos` y auditoria.

## Deploy en Vercel

1. Sube el repositorio.
2. Crea proyecto en Vercel.
3. Configura variables de entorno iguales a `.env.example`.
4. Verifica que `APP_URL` apunte al dominio de Vercel.
5. Ejecuta migraciones en Supabase antes de abrir produccion.
6. Deploy.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
```

## Pendientes de hardening

- Dividir politicas RLS de update por columna mediante RPCs dedicadas.
- Generar QR como imagen compartible por WhatsApp.
- Agregar push notifications reales.
- Agregar pruebas automatizadas de servicios y server actions.
- Conectar flujos de edicion avanzada de usuarios, domicilios y avisos.
