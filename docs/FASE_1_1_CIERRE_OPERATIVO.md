# Fase 1.1 — Cierre operativo para piloto

> Estado: **CASI COMPLETA**. Implementado todo el alcance operativo salvo la
> importación de colonos por CSV, diferida en modo controlado (ver nota).

## Implementado en esta iteración

### Alta completa de usuarios desde administración ✅

`/admin/usuarios` ahora crea la **cuenta de acceso (Supabase Auth) y el perfil** en un
solo paso, sin copiar UUIDs ni abrir Supabase.

**Flujo de credenciales elegido — Opción C (contraseña capturada por administración):**
es la más compatible con Supabase y no requiere infraestructura de correo. El admin
define una contraseña temporal y la comparte con el usuario; el usuario podrá cambiarla
después. (Magic link / invitación por correo quedan como evolución futura, ya hay
`magicLinkAction` disponible.)

**Reglas aplicadas (server-side):**
- Fraccionamiento asignado automáticamente al del admin (no se acepta del cliente).
- Roles permitidos: `COLONO`, `GUARDIA`, `ADMINISTRACION`. **SUPERADMIN bloqueado** por
  el propio enum del validador.
- COLONO requiere domicilio, y el domicilio debe pertenecer al fraccionamiento del admin.
- Tope de **2 colonos activos por domicilio** (validado en servicio + trigger DB).
- Email obligatorio y válido; contraseña mínimo 8 caracteres.
- Email duplicado → mensaje claro "Ya existe un usuario con ese email".
- Si falla la creación del perfil, se elimina la cuenta Auth para no dejar huérfanos.
- Auditoría `USUARIO_CREAR`.

**Archivos:**
- `src/lib/validators/users.ts` — `createUserWithAccountSchema` (+ test).
- `src/lib/services/admin.service.ts` — `createUserWithAccount()` (usa admin client para
  Auth, repo RLS para el perfil).
- `src/server/actions/admin.actions.ts` — `createUserWithAccountAction` (con estado).
- `src/features/admin/create-user-form.tsx` — formulario cliente con feedback.
- `src/app/admin/usuarios/page.tsx` — usa el nuevo formulario.
- `src/lib/validators/users.test.ts` — 6 pruebas del esquema.

> Nota: el alta de **guardias** funciona con este mismo formulario (rol GUARDIA, sin
> domicilio). Un panel dedicado en `/admin/guardias` es parte del pendiente de 1.1/1.4.

## Estado del alcance 1.1

| Tarea | Estado |
|---|---|
| Alta de usuarios (Auth + perfil) desde admin | ✅ |
| Reenvío de acceso / regenerar contraseña desde admin | ✅ |
| Alta de guardias en panel dedicado `/admin/guardias` | ✅ |
| Importación de domicilios por CSV (carga, preview, errores por fila, auditoría) | ✅ |
| QR compartible como **imagen** (descarga + Web Share, fallback texto) | ✅ |
| Checklist de puesta en marcha del tenant | ✅ |
| Docs onboarding + formatos CSV | ✅ |
| Importación de colonos por CSV | 🟡 Diferida en modo controlado |

### Implementado en esta iteración (resumen)

- **QR como imagen:** `QRDisplay` añade "Descargar QR" (PNG); `ShareInvitation` comparte
  la imagen del QR vía Web Share nivel 2 (archivos) cuando el dispositivo lo permite, con
  fallback a texto y a `wa.me`. Mensaje de compartir simplificado.
- **Panel de guardias:** `/admin/guardias` usa el formulario de alta con rol fijo GUARDIA
  (crea cuenta + perfil), lista guardias con activar/desactivar y regenerar acceso.
- **Regenerar acceso:** `ResetPasswordButton` + acción + servicio `resetUserPassword`
  (genera contraseña temporal con `service_role`, audita `USUARIO_RESET_PASSWORD`). En
  `/admin/usuarios` y `/admin/guardias`.
- **Checklist de onboarding:** query `getTenantReadiness()` + `TenantReadinessPanel` en
  `/admin` (estados LISTO/INCOMPLETO/REQUIERE_ATENCION/SUSPENDIDO).
- **Importación CSV de domicilios:** `ImportHouseholdsForm` (parser, preview con validación
  por fila, confirmación) + acción + servicio `importHouseholds` (audita `DOMICILIOS_IMPORTAR`).

### Nota — colonos por CSV (diferido controlado)

Crear colonos masivamente exige crear su cuenta Auth por fila y distribuir contraseñas de
forma segura. Para no entregar credenciales de forma insegura en esta fase, se mantiene el
alta uno por uno desde `/admin/usuarios`. La estructura de importación (parser, preview,
validación por fila, auditoría) ya existe en domicilios y se reutilizará. Ver
`docs/FORMATO_IMPORTACION_COLONOS.csv`.

## Pruebas

- `npm run test` → 12/12 (incluye 6 nuevas del validador de alta de usuarios).
- `npm run lint`, `npm run typecheck`, `npm run build` → ✅.

## Casos de prueba manual recomendados

1. Admin crea un GUARDIA → el guardia inicia sesión en `/login` y llega a `/caseta`.
2. Admin crea un COLONO con domicilio → inicia sesión y llega a `/app`.
3. Admin intenta crear un 3.er colono activo en un domicilio → bloqueado con mensaje.
4. Admin intenta crear con un email ya existente → mensaje "Ya existe un usuario...".
5. Verificar en `auditoria` que cada alta queda registrada con actor y rol.
