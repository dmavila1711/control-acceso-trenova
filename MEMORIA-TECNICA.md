# Memoria técnica y funcional — Control de Acceso Trenova

> Documento de referencia del proyecto: propósito, arquitectura, base de datos,
> seguridad, flujos funcionales por rol y despliegue. Última actualización: 2026-06-18.

---

## Índice

1. [Propósito y contexto](#1-propósito-y-contexto)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura general](#3-arquitectura-general)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Conexión con Supabase (los 3 clientes)](#5-conexión-con-supabase-los-3-clientes)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Seguridad y RLS](#8-seguridad-y-rls)
9. [Autenticación y sesión](#9-autenticación-y-sesión)
10. [QR y código numérico](#10-qr-y-código-numérico)
11. [Auditoría](#11-auditoría)
12. [Zona horaria](#12-zona-horaria)
13. [Roles y permisos](#13-roles-y-permisos)
14. [Recorrido funcional por módulo](#14-recorrido-funcional-por-módulo)
15. [Validaciones (Zod)](#15-validaciones-zod)
16. [Métricas](#16-métricas)
17. [PWA](#17-pwa)
18. [Migraciones y orden de aplicación](#18-migraciones-y-orden-de-aplicación)
19. [Puesta en marcha de un fraccionamiento](#19-puesta-en-marcha-de-un-fraccionamiento)
20. [Despliegue (Vercel + Supabase)](#20-despliegue-vercel--supabase)
21. [Limitaciones conocidas y pendientes](#21-limitaciones-conocidas-y-pendientes)
22. [Mapa de archivos clave](#22-mapa-de-archivos-clave)

---

## 1. Propósito y contexto

**Control de Acceso Trenova** es una **PWA multitenant (SaaS)** para fraccionamientos
privados. Sustituye el uso de Google Forms para registrar visitas con una solución
real de control de acceso:

- Los **colonos** registran invitaciones y obtienen un **QR + código numérico**.
- La **caseta (guardia)** valida el acceso por QR o código y registra cada entrada/rechazo.
- **Administración** gestiona domicilios, usuarios, guardias, avisos y mensajes de su fraccionamiento.
- Un **superadmin** opera múltiples fraccionamientos desde la misma plataforma.

Principios rectores: **aislamiento total entre fraccionamientos**, **auditoría de todo
movimiento crítico**, **seguridad server-side** y **simplicidad de uso** en celular.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js (App Router) |
| Lenguaje | TypeScript estricto |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth + `@supabase/ssr` |
| Seguridad de datos | Row Level Security (RLS) por fraccionamiento/domicilio |
| Estilos | Tailwind CSS + variables CSS (HSL) |
| Formularios | React Hook Form |
| Validación | Zod (cliente y servidor) |
| QR | `qrcode` (generar) · `html5-qrcode` (escanear) |
| Iconos | `lucide-react` |
| Pruebas | Vitest |
| Hosting | Vercel |

---

## 3. Arquitectura general

El sistema está desacoplado por capas. **La lógica de negocio nunca llama a Supabase
directamente desde los componentes visuales.**

```
UI (componentes / páginas)
        │
        ▼
Server Actions  /  Server Queries        ← entrada server-side, validan rol y tenant
        │
        ▼
Servicios de dominio (lib/services)      ← reglas de negocio, orquestación, auditoría
        │
        ▼
Repositorios (interfaces lib/repositories/contracts)
        │
        ▼
Adaptador Supabase (lib/repositories/supabase)  ← única capa que conoce Supabase
        │
        ▼
PostgreSQL + RLS
```

**Patrón repositorio:** todas las operaciones de datos pasan por interfaces
(`InvitationRepository`, `UserRepository`, `AccessLogRepository`, etc.) definidas en
`src/lib/repositories/contracts.ts`. La implementación concreta vive en
`src/lib/repositories/supabase/index.ts`. Para migrar a otro proveedor de base de
datos en el futuro, basta con escribir un nuevo adaptador que cumpla las mismas
interfaces, **sin tocar servicios ni UI**.

**Defensa en profundidad:** la seguridad se valida en tres niveles → (1) RLS en la
base de datos, (2) guards de rol/tenant en server actions y servicios, (3) validación
Zod de entrada.

---

## 4. Estructura de carpetas

```
src/
  app/                      Rutas por rol
    app/                    Portal COLONO
    caseta/                 Panel GUARDIA
    admin/                  Panel ADMINISTRACION
    superadmin/             Panel SUPERADMIN
    login/                  Inicio de sesión
    auth/callback/          Callback de magic link / OAuth
  components/
    layout/                 AppShell, NoticeBanner, RoleGuard, PwaRegister
    ui/                     Button, Card, Input, Badge, EmptyState, etc.
    qr/                     QRDisplay, ShareInvitation (WhatsApp)
    scanner/                QrScannerPanel (cámara)
  features/                 Flujos compuestos (auth, invitations, access, preferences)
  lib/
    auth/                   session.ts (helpers), roles.ts (redirección por rol)
    audit/                  audit.ts → auditAction()
    qr/                     tokens.ts (HMAC + AES-GCM, generación de QR/código)
    time/                   zoned.ts (límites de día/mes por zona horaria) + test
    repositories/           contracts.ts (interfaces) + supabase/ (adaptador)
    security/               guards.ts (assertRole, requireFractionationAccess, …)
    services/               invitations / access / admin / fractionations / context
    supabase/               browser.ts · server.ts · admin.ts
    validators/             esquemas Zod por entidad
    env.ts                  lectura de variables de entorno
    errors.ts               AppError, AuthError, ForbiddenError
    utils.ts                cn(), formatDateTime(), toJson()
  server/
    actions/                Server actions (escritura: auth, invitations, access, admin, superadmin)
    queries/                Server queries (lectura: dashboard, caseta, admin, superadmin)
  types/                    domain.ts (tipos de dominio + enums) · database.ts (tipos de tablas)
supabase/
  migrations/               0001_initial_schema · 0002_zona_horaria · 0003_fix_config_trigger
  seed.sql                  Datos demo
  config.toml               Configuración del CLI de Supabase
scripts/
  crear-usuario.mjs         Alta de usuario Auth + perfil vinculado
middleware.ts               Refresca la sesión de Supabase en cada request
```

---

## 5. Conexión con Supabase (los 3 clientes)

La aplicación se conecta a Supabase con **tres clientes distintos**, cada uno con un
propósito y nivel de privilegio:

| Cliente | Archivo | Llave | Uso |
|---|---|---|---|
| **Server (SSR)** | `src/lib/supabase/server.ts` | `anon` | Cliente principal server-side. Lee la sesión desde cookies (`@supabase/ssr`). **Respeta RLS** según el usuario logueado. Lo usan servicios, queries y la mayoría de las operaciones. |
| **Admin (service role)** | `src/lib/supabase/admin.ts` | `service_role` | Marcado `server-only`. **Salta RLS**. Reservado para operaciones de sistema (p. ej. el script de alta de usuarios crea cuentas Auth). Nunca se expone al cliente. |
| **Browser** | `src/lib/supabase/browser.ts` | `anon` | Cliente para el navegador. Disponible pero hoy poco usado: el login y las escrituras se hacen vía server actions. |

**Cómo viaja la sesión:** Supabase Auth guarda la sesión en **cookies**. El
`middleware.ts` corre en cada request y llama a `supabase.auth.getUser()` para
**refrescar los tokens** y mantener la sesión viva. Las páginas server-side leen la
sesión con `createSupabaseServerClient()` (que lee esas cookies).

> ⚠️ La `SUPABASE_SERVICE_ROLE_KEY` jamás debe llegar al cliente. Solo se usa en
> código server-side (`admin.ts` importa `"server-only"` para forzarlo).

---

## 6. Variables de entorno

Definidas en `.env.example` y leídas de forma centralizada en `src/lib/env.ts`:

| Variable | Tipo | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Llave anónima (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreta** | Llave service_role (solo servidor) |
| `APP_URL` | Pública | URL pública de la app (para redirecciones de auth) |
| `QR_SECRET` | **Secreta** | Secreto para HMAC y cifrado del token QR |
| `NUMERIC_CODE_SECRET` | **Secreta** | Secreto para HMAC y cifrado del código numérico |
| `APP_TIMEZONE` | Pública | Zona horaria por defecto (`America/Mexico_City`) |

`env.ts` lee las variables `NEXT_PUBLIC_*` con **acceso literal** (no dinámico) para
que Next.js las inyecte correctamente en el bundle, y lanza un error claro si falta
alguna requerida.

---

## 7. Modelo de datos

Todas las tablas viven en el esquema `public`. PK `uuid` con `gen_random_uuid()`.

### Tablas

**`fraccionamientos`** — el tenant.
`id, nombre, direccion, contacto_admin, email_contacto, estatus, created_at,
updated_at, suspended_at, suspended_by, suspension_reason`
Estatus: `ACTIVO · SUSPENDIDO · EN_CONFIGURACION · INACTIVO`.

**`domicilios`** — casas de un fraccionamiento.
`id, fraccionamiento_id→fraccionamientos, calle, numero_exterior, numero_interior,
referencia, estatus, created_at, updated_at`. Estatus: `ACTIVO · INACTIVO`.

**`perfiles_usuario`** — perfil de dominio, vinculado a Supabase Auth por `auth_user_id`.
`id, auth_user_id (unique), fraccionamiento_id, domicilio_id, nombre, email, rol,
estatus, deactivated_at, deactivated_by, …`
Roles: `SUPERADMIN · ADMINISTRACION · GUARDIA · COLONO`. Estatus: `ACTIVO · INACTIVO · SUSPENDIDO`.
Constraint `perfiles_usuario_scope` exige:
- SUPERADMIN → sin fraccionamiento ni domicilio.
- COLONO → con fraccionamiento **y** domicilio.
- ADMINISTRACION/GUARDIA → con fraccionamiento, sin domicilio.

**`invitaciones`** — pertenece al **domicilio** (no a la persona).
`id, fraccionamiento_id, domicilio_id, created_by, tipo_visita, nombre_visitante,
empresa, telefono_visitante, placas, tipo_autorizacion, fecha_inicio, fecha_fin,
estatus, qr_token_hash, codigo_numerico_hash, qr_token_ciphertext,
codigo_numerico_ciphertext, codigo_numerico_last4, observaciones, cancelled_at, cancelled_by, …`
- Tipos de visita: `VISITA · TRANSPORTE · PAQUETERIA_MENSAJERIA · SERVICIO_PROVEEDOR · OTRO`.
- Tipos de autorización: `UN_DIA · HOY_MANANA · VISITA_FRECUENTE · EN_CASETA`.
- Estatus: `VIGENTE · USADA · CANCELADA · EXPIRADA · RECHAZADA_EN_CASETA`.
- Constraint: `fecha_fin >= fecha_inicio`.

**`accesos`** — bitácora de cada validación en caseta.
`id, fraccionamiento_id, domicilio_id, invitacion_id, guardia_id, nombre_visitante,
tipo_visita, metodo_validacion, resultado, observaciones, arrived_at, resolved_at, …`
- Método: `QR · CODIGO_NUMERICO · BUSQUEDA_MANUAL · SIN_INVITACION`.
- Resultado: `PERMITIDO · RECHAZADO · INVITACION_EXPIRADA · INVITACION_CANCELADA ·
  INVITACION_NO_ENCONTRADA · DOMICILIO_INACTIVO · FRACCIONAMIENTO_SUSPENDIDO · OTRO`.

**`avisos_generales`** — banners por fraccionamiento.
`id, fraccionamiento_id, titulo, mensaje, prioridad, fecha_inicio, fecha_fin, estatus,
created_by, …`. Prioridad: `BAJA · NORMAL · ALTA`. Solo se muestran si `now()` está
dentro de `[fecha_inicio, fecha_fin]` y estatus `ACTIVO`. Constraint `fecha_fin > fecha_inicio`.

**`mensajes_administrativos`** — mensajes internos a usuarios específicos.
`id, fraccionamiento_id, sender_id, recipient_id, titulo, mensaje, canal, estatus,
read_at, created_at`. Canal: `INTERNO · EMAIL · WHATSAPP · PUSH` (Fase 1 usa `INTERNO`).

**`auditoria`** — registro inmutable de movimientos.
`id, fraccionamiento_id, actor_user_id, actor_role, action, entity_type, entity_id,
domicilio_id, metadata (jsonb), previous_values (jsonb), new_values (jsonb),
ip_address, user_agent, created_at`.

**`configuracion_fraccionamiento`** — config por tenant (1:1).
`id, fraccionamiento_id (unique), max_usuarios_por_domicilio (default 2),
permite_compartir_whatsapp, requiere_email_usuario, zona_horaria (default
'America/Mexico_City'), …`.

**`eventos_mensaje`** — base para métricas de mensajería multicanal futura.

### Triggers y funciones

- `touch_updated_at()` — actualiza `updated_at` en cada UPDATE (en varias tablas).
- `ensure_fractionation_config()` — **SECURITY DEFINER**; al insertar un
  fraccionamiento crea su fila de `configuracion_fraccionamiento` (salta RLS de
  forma controlada porque es un invariante de sistema).
- `enforce_colono_limit()` — BEFORE insert/update; impide más de N colonos activos
  por domicilio (N = `max_usuarios_por_domicilio`).
- Funciones helper para RLS (todas `SECURITY DEFINER STABLE`, leen `auth.uid()`):
  `current_profile_id()`, `current_role()`, `current_fraccionamiento_id()`,
  `current_domicilio_id()`, `is_superadmin()`.

---

## 8. Seguridad y RLS

**Row Level Security activado** en todas las tablas sensibles. Las políticas usan las
funciones helper `SECURITY DEFINER` (que consultan `perfiles_usuario` sin recursión de
RLS). Resumen de las reglas:

| Tabla | Quién lee | Quién escribe |
|---|---|---|
| `fraccionamientos` | superadmin (todo) · su propio fraccionamiento | superadmin |
| `domicilios` | superadmin · su fraccionamiento · su domicilio | superadmin · admin de su fraccionamiento |
| `perfiles_usuario` | superadmin · uno mismo · admin de su fracc. · colonos del mismo domicilio | superadmin · admin de su fracc. (rol ≠ SUPERADMIN) |
| `invitaciones` | superadmin · admin/guardia de su fracc. · colono de su domicilio | colono (su domicilio) · admin/guardia de su fracc. |
| `accesos` | superadmin · admin/guardia de su fracc. · colono de su domicilio | admin/guardia de su fracc. |
| `avisos_generales` | superadmin · su fraccionamiento | superadmin · admin de su fracc. |
| `mensajes_administrativos` | superadmin · remitente/destinatario · admin de su fracc. | admin de su fracc. (insert) · destinatario (marcar leído) |
| `auditoria` | superadmin · admin de su fracc. | cualquier autenticado (insert) |
| `configuracion_fraccionamiento` | superadmin · su fracc. | superadmin · admin de su fracc. (update) |

**Garantías:** ningún colono ve datos de otro domicilio; nadie ve datos de otro
fraccionamiento; el guardia solo ve lo necesario para caseta dentro de su
fraccionamiento; el superadmin opera globalmente pero sus acciones críticas se auditan.

> Pendiente de hardening (documentado en el SQL): dividir políticas de UPDATE por
> columna mediante RPCs dedicadas para reglas más granulares.

---

## 9. Autenticación y sesión

**Login** (`/login`): formulario con email + contraseña, y opción de **magic link**.

- `loginAction` (server action): `signInWithPassword` → busca el perfil →
  valida que el estatus sea `ACTIVO` (si no, cierra sesión y muestra
  *"Tu usuario se encuentra inactivo. Contacta a administración."*) → redirige según rol.
- `magicLinkAction`: `signInWithOtp` con redirección a `/auth/callback`.
- `/auth/callback`: intercambia el código por sesión (`exchangeCodeForSession`).
- `logoutAction`: cierra sesión y vuelve a `/login`.

**Redirección por rol** (`lib/auth/roles.ts → homeForRole`):
`SUPERADMIN → /superadmin · ADMINISTRACION → /admin · GUARDIA → /caseta · COLONO → /app`.

**Helpers de sesión** (`lib/auth/session.ts`):
- `getCurrentUserProfile()` — perfil del usuario logueado (o null).
- `requireAuth()` — exige sesión activa y estatus ACTIVO.
- `requireRole([...])` — exige sesión + rol permitido (cada layout lo invoca).
- `redirectIfAuthenticated()` / `redirectToRoleHome()`.

**Guards** (`lib/security/guards.ts`): `assertRole`, `requireFractionationAccess`,
`requireHouseholdAccess`, `assertFractionationActive`.

---

## 10. QR y código numérico

Lógica en `src/lib/qr/tokens.ts` (server-only). **No se guarda nada sensible en texto plano.**

Al **crear** una invitación:
1. Se genera un **token QR aleatorio** (`randomBytes(32)` base64url). El QR contiene
   `access:<token>` — un valor opaco, sin datos personales.
2. Se genera un **código numérico de 6 dígitos**.
3. Se guardan:
   - `qr_token_hash` / `codigo_numerico_hash` → **HMAC-SHA256** (para búsqueda en validación).
   - `qr_token_ciphertext` / `codigo_numerico_ciphertext` → **AES-256-GCM** (para re-mostrar al colono).
   - `codigo_numerico_last4` → solo los últimos 4 dígitos (referencia).
4. Se muestran el QR y el código al colono una vez; puede compartirlos por WhatsApp.

Al **validar** en caseta: se recibe el token/código, se calcula su HMAC, se busca la
invitación coincidente **dentro del fraccionamiento del guardia**, y se evalúa
vigencia/estatus/domicilio/fraccionamiento. Todo queda auditado.

---

## 11. Auditoría

Función central `auditAction()` en `src/lib/audit/audit.ts`. Cada movimiento crítico
la invoca. Registra: actor (usuario y rol), fraccionamiento, domicilio (si aplica),
entidad, acción, valores previos/nuevos, metadata, IP, user-agent y fecha.

Acciones auditadas incluyen: crear/cancelar invitación, validar QR/código, permitir/
rechazar acceso, intento no encontrado, crear/editar/activar/desactivar usuario,
crear/cambiar domicilio, crear aviso, enviar mensaje, y crear/suspender/reactivar
fraccionamiento. **No existe pantalla para editar auditoría.**

---

## 12. Zona horaria

Los límites de día/mes se calculan en la **zona del fraccionamiento**, no en la del
servidor (que en Vercel es UTC). Sin esto, una invitación de "un día" expiraría a media
tarde hora local.

- Helper `src/lib/time/zoned.ts`: `zonedStartOfDay`, `zonedEndOfDay`,
  `zonedStartOfMonth`, `zonedEndOfDayPlusDays`, `zonedDayBounds`, `resolveTimeZone`.
  Usa `Intl` con ajuste de offset en dos pasos (cubre horario de verano) y truncado a
  segundos (evita desbordes de milisegundos). Probado en `zoned.test.ts`.
- **Configurable por tenant:** columna `configuracion_fraccionamiento.zona_horaria`
  (default `America/Mexico_City`). El default global se puede fijar con `APP_TIMEZONE`.
- Aplicado en: cálculo de vigencia de invitaciones y en las métricas (admin usa la zona
  de su fraccionamiento; superadmin usa el default).

---

## 13. Roles y permisos

**SUPERADMIN** — administra todos los fraccionamientos (crear/editar/suspender/reactivar),
métricas globales y auditoría crítica. No opera accesos diarios.

**ADMINISTRACION** — administra **su** fraccionamiento: domicilios, usuarios (alta,
activar/desactivar), guardias, invitaciones (consulta/cancelación), accesos, avisos,
mensajes internos, auditoría y dashboard. Es el **único** rol del fraccionamiento que
activa/desactiva usuarios.

**GUARDIA** — panel de caseta: escanear QR, capturar código, buscar invitaciones,
permitir/rechazar acceso, registrar intentos no encontrados, ver avisos y accesos
recientes. No administra usuarios ni domicilios.

**COLONO** — pertenece a un domicilio: crea/cancela invitaciones de su domicilio, ve
QR y código, comparte por WhatsApp, consulta accesos de su domicilio, ve avisos y
mensajes internos. Personaliza su portal (color y tamaño de texto).

**Reglas críticas activas:** email obligatorio; máximo 2 colonos activos por domicilio;
usuario inactivo no puede entrar; fraccionamiento suspendido no genera invitaciones
nuevas; todo movimiento auditado; aislamiento estricto por fraccionamiento/domicilio.

---

## 14. Recorrido funcional por módulo

### Colono — `/app`
- **Inicio**: avisos vigentes, botón crear invitación, invitaciones vigentes, últimos
  accesos y mensajes recientes.
- **Invitaciones** (`/app/invitaciones`): lista por estatus; detalle (`/[id]`) con QR,
  código, vigencia e historial; **cancelar** si está vigente.
- **Nueva** (`/app/invitaciones/nueva`): tipo de visita, datos del visitante y tipo de
  autorización. El formulario muestra **solo los campos relevantes** según el tipo:
  *Un día* pide la fecha; *Visita frecuente* pide "vigente hasta" (máx. 90 días);
  *Hoy y mañana* y *En caseta* no piden fecha. Tras crear: QR + código + compartir WhatsApp.
- **Accesos** (`/app/accesos`): historial del domicilio.
- **Mensajes** (`/app/mensajes`): mensajes de administración.
- **Personalizar** (`/app/configuracion`): acento de color y tamaño de texto, guardado
  en `localStorage` del dispositivo (no toca el servidor).

### Caseta / Guardia — `/caseta`
- **Inicio**: avisos, invitaciones válidas de hoy, accesos recientes.
- **Escanear** (`/caseta/escanear`): cámara + validación de QR.
- **Código** (`/caseta/codigo`): captura del código de 6 dígitos.
- **Buscar** (`/caseta/buscar`): por nombre del visitante **o por domicilio** (calle/número).
- **Detalle / decisión**: datos de la invitación + **Permitir** / **Rechazar** con
  observaciones. *Permitir* re-valida la invitación en el momento (no permite
  canceladas/expiradas/usadas). Cada decisión crea un registro en `accesos` y auditoría.

### Administración — `/admin`
- **Inicio**: métricas del día y últimos movimientos.
- **Domicilios** · **Usuarios** · **Guardias** · **Invitaciones** · **Accesos** ·
  **Avisos** · **Mensajes** · **Auditoría** (ver detalle en [§13](#13-roles-y-permisos)).

### Superadmin — `/superadmin`
- **Inicio**: métricas globales.
- **Fraccionamientos**: crear/editar/suspender/reactivar + detalle (`/[id]`).
- **Métricas** y **Auditoría** globales.

---

## 15. Validaciones (Zod)

Esquemas en `src/lib/validators/`. Se validan **siempre server-side** (no se confía en
el cliente):

- **Invitación**: nombre, tipo de visita y autorización requeridos; fecha según tipo;
  `fecha_fin >= fecha_inicio`; límite de 90 días para visita frecuente.
- **Usuario**: nombre y email válidos; rol; domicilio requerido si COLONO;
  fraccionamiento requerido si no es SUPERADMIN; tope de 2 colonos activos.
- **Aviso**: título, mensaje, fecha inicio/fin con `fin > inicio`.
- **Mensaje**: destinatarios, título y mensaje requeridos.
- **Acceso**: guardia válido, resultado válido, invitación si aplica.

---

## 16. Métricas

Calculadas con queries agregadas server-side (`COUNT exact`), sin sistema de analytics.

- **Admin**: invitaciones hoy/mes, accesos hoy, permitidos, rechazados, usuarios y
  domicilios activos, avisos activos, validaciones por QR y por código.
- **Superadmin**: fraccionamientos totales/activos/suspendidos, usuarios activos,
  invitaciones y accesos hoy/mes, mensajes internos.

Los rangos "hoy/mes" respetan la [zona horaria](#12-zona-horaria).

---

## 17. PWA

`public/manifest.json` + `public/sw.js`, registrados por
`components/layout/pwa-register.tsx`. Diseño mobile-first (prioridad celular para
colonos; tablet/desktop para caseta y administración). Cabeceras de seguridad
(`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) en `next.config.ts`.

---

## 18. Migraciones y orden de aplicación

Aplicar en orden en **Supabase → SQL Editor** (o `supabase db push`):

1. `0001_initial_schema.sql` — tablas, enums, constraints, triggers, funciones helper y RLS.
2. `0002_zona_horaria.sql` — añade `configuracion_fraccionamiento.zona_horaria` (idempotente).
3. `0003_fix_config_trigger.sql` — marca `ensure_fractionation_config` como SECURITY
   DEFINER (corrige el error de RLS al crear fraccionamientos).
4. `0004_seguridad.sql` — tabla `eventos_seguridad` (rate limiting / abusos) con RLS, y
   triggers que hacen `auditoria` y `eventos_seguridad` **append-only** (sin UPDATE/DELETE).

`seed.sql` es opcional (datos demo); sus perfiles no pueden iniciar sesión hasta crear
usuarios Auth reales.

---

## 19. Puesta en marcha de un fraccionamiento

1. **Superadmin** crea el fraccionamiento en `/superadmin/fraccionamientos`.
2. Copia el `id` del fraccionamiento (Supabase → Table Editor → `fraccionamientos`).
3. Crea el usuario de **Administración** (script recomendado):
   ```bash
   npm run crear-usuario -- --email admin@dominio.com --password "Clave123" \
     --nombre "Administración" --rol ADMINISTRACION --fraccionamiento <UUID_FRACC>
   ```
4. Entra como admin → `/admin` → crea **domicilios**.
5. Crea **guardias** y **colonos** (script, o alta manual: crear cuenta en Supabase Auth
   → copiar UUID → pegarlo en `/admin/usuarios`).
6. Cada usuario entra en `/login` y va a su panel según rol.

> Desde **Fase 1.1**, `/admin/usuarios` crea la **cuenta de acceso (Auth) + el perfil**
> en un solo paso (administración define una contraseña temporal). El script
> `scripts/crear-usuario.mjs` sigue disponible para el primer superadmin y para altas
> por línea de comandos.

---

## 20. Despliegue (Vercel + Supabase)

1. Subir el repositorio a GitHub.
2. Crear proyecto en Supabase; copiar URL, anon key y service_role.
3. Aplicar migraciones `0001`→`0002`→`0003`.
4. Importar el repo en Vercel; configurar las [variables de entorno](#6-variables-de-entorno).
5. Deploy.
6. Ajustar `APP_URL` al dominio real y, en Supabase → Authentication → URL
   Configuration, fijar **Site URL** y agregar `…/auth/callback` a **Redirect URLs**.
7. Crear el primer superadmin con `npm run crear-usuario … --rol SUPERADMIN`.

Cada `git push` a `main` dispara un deploy automático. Las migraciones se aplican
manualmente en Supabase.

---

## 21. Limitaciones conocidas y pendientes

**Roadmap Fase 1.1–1.5** (ver `docs/FASE_1_*`): alta de usuarios desde admin ✅;
pendientes: importación CSV de domicilios/colonos, QR como imagen compartible, rate
limiting de QR/código, inmutabilidad reforzada de auditoría, UX avanzada de caseta,
CRUD/exportes de administración y dashboards de salud del tenant.

**Hardening futuro** (documentado en el código):
- Políticas RLS de UPDATE por columna mediante RPCs dedicadas.
- Generar el QR como imagen compartible por WhatsApp (hoy se comparte texto + código).
- Pruebas automatizadas de servicios y server actions.

**Excluido de Fase 1 (estructura preparada para fases futuras):** apertura automática de
plumas, integración con cámaras, reconocimiento facial, lectura de placas, WhatsApp
Cloud API, push notifications reales, modo emergencia completo, control de salida, app
nativa, geolocalización, motor avanzado de horarios, análisis de accesos sospechosos.

---

## 22. Mapa de archivos clave

| Necesito… | Archivo |
|---|---|
| Conexión a Supabase | `src/lib/supabase/{server,admin,browser}.ts` |
| Variables de entorno | `src/lib/env.ts` · `.env.example` |
| Esquema de base de datos | `supabase/migrations/*.sql` |
| Interfaces de repositorio | `src/lib/repositories/contracts.ts` |
| Adaptador Supabase | `src/lib/repositories/supabase/index.ts` |
| Reglas de negocio | `src/lib/services/*.service.ts` |
| Auth y sesión | `src/lib/auth/{session,roles}.ts` · `src/server/actions/auth.actions.ts` |
| Guards de seguridad | `src/lib/security/guards.ts` |
| QR / código | `src/lib/qr/tokens.ts` |
| Auditoría | `src/lib/audit/audit.ts` |
| Zona horaria | `src/lib/time/zoned.ts` |
| Validaciones | `src/lib/validators/*.ts` |
| Server actions (escritura) | `src/server/actions/*.ts` |
| Server queries (lectura) | `src/server/queries/*.ts` |
| Tipos de dominio/tablas | `src/types/{domain,database}.ts` |
| Alta de usuarios | `scripts/crear-usuario.mjs` |
| Refresco de sesión | `middleware.ts` |
