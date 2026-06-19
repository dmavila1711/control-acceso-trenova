# Fase 1.2 — Hardening de seguridad

> Estado: **COMPLETADA** (con CSP diferida y documentada). Build, lint, typecheck y
> pruebas en verde.

## Qué se implementó

### 1. Rate limiting de validación en caseta
Protección contra fuerza bruta de código numérico y QR.

- Umbrales (`src/lib/security/rate-limit.ts`): **5 fallos/min por guardia** y
  **20 fallos/10 min por fraccionamiento**.
- Antes de validar (`validateQr` / `validateNumericCode`), se cuentan los intentos
  fallidos recientes; si se excede, se registra un evento `RATE_LIMIT_QR` / `RATE_LIMIT_CODE`
  y se devuelve un resultado **genérico** ("Demasiados intentos…") que **no revela** si el
  código existe, ni a qué domicilio/fraccionamiento pertenece, ni cercanía de coincidencia.
- El conteo se hace server-side con `service_role` (no depende de RLS del usuario).

### 2. Eventos de seguridad (`eventos_seguridad`)
Migración `0004_seguridad.sql`. Registra:
`RATE_LIMIT_CODE/QR`, `INVALID_CODE_ATTEMPT`, `INVALID_QR_ATTEMPT`,
`CROSS_TENANT_ATTEMPT`, (estructura lista para `ACCESS_DENIED`,
`SUSPENDED_FRACTIONATION_ATTEMPT`).
- Nunca guarda el código/token crudo; solo `resultado` y metadatos no sensibles.
- RLS: lectura para superadmin (global) y administración (su fraccionamiento). Escritura
  server-side con service role.

### 3. Single-use atómico de invitaciones
`decideAccess` ahora reclama la invitación de un solo uso con una actualización
condicional `UPDATE … WHERE estatus = 'VIGENTE'` (`markUsedIfVigente`). Si dos guardias
permiten la misma invitación al mismo tiempo, **solo uno gana**; el otro recibe
"La invitación ya fue utilizada." (Las de visita frecuente no se marcan USADA.)

### 4. Auditoría y eventos de seguridad append-only
Triggers `deny_mutation()` bloquean **UPDATE y DELETE** sobre `auditoria` y
`eventos_seguridad` (incluido el service role). Las tablas de registro son inmutables; solo
admiten INSERT.

### 5. Detección cross-tenant
Si un guardia intenta decidir sobre una invitación de otro fraccionamiento, se registra
`CROSS_TENANT_ATTEMPT` (severidad CRITICAL) y se bloquea sin filtrar información.

### 6. Headers de seguridad
`next.config.ts` añade `Permissions-Policy` (cámara solo en self; micrófono y geolocalización
denegados) y `X-DNS-Prefetch-Control: off`, además de los ya existentes.

## Diferido y documentado
- **Content-Security-Policy:** se difiere para no romper Supabase Auth, las imágenes
  `data:` del QR ni la cámara (`html5-qrcode`). Requiere CSP con nonce y pruebas dedicadas
  de todos los flujos. TODO dejado en `next.config.ts`.
- **Sesión de guardia / cierre por inactividad:** pendiente para una iteración de UX de
  caseta (Fase 1.3), donde encaja mejor con el rediseño del panel.
- **RLS de UPDATE por columna vía RPC:** las escrituras sensibles ya pasan por server
  actions/servicios con validación; el endurecimiento por columna queda como mejora.

## Archivos
- `supabase/migrations/0004_seguridad.sql` (tabla + triggers append-only)
- `src/lib/security/rate-limit.ts` (lógica pura + test)
- `src/lib/security/events.ts` (registro y conteo con service role)
- `src/lib/services/access.service.ts` (rate limit + eventos + single-use atómico)
- `src/lib/repositories/{contracts,supabase/index}.ts` (`markUsedIfVigente`)
- `src/types/database.ts` (`SecurityEventRow` + tabla)
- `next.config.ts` (headers)

## Pruebas
- `npm run test` → 17/17 (5 nuevas de rate limiting).
- `npm run lint`, `npm run typecheck`, `npm run build` → ✅.

> La cobertura automatizada de RLS cross-tenant y de los triggers append-only requiere un
> Supabase de prueba; se documentan como casos manuales en `CASOS_PRUEBA_SEGURIDAD.md`.
