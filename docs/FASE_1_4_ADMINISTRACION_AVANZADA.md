# Fase 1.4 — Administración avanzada

> Estado: **COMPLETA**. Lint, typecheck y pruebas en verde (el `build` local falla solo en
> el prerender por falta de `NEXT_PUBLIC_SUPABASE_URL`; issue ambiental preexistente).
> Incluye el núcleo previo y el paquete "Fase 1.4 restante" (detalle de domicilio,
> filtros avanzados y avisos segmentados).

## Implementado

### Bloqueo de invitaciones por domicilio
Nuevo estatus de domicilio **`BLOQUEADO_PARA_INVITACIONES`** (migración `0005`).
- El colono de ese domicilio **no puede crear nuevas invitaciones** (mensaje claro).
- El **historial sigue consultable** y las **invitaciones existentes siguen validándose**
  en caseta (solo `INACTIVO` invalida la validación).
- En `/admin/domicilios`, cada domicilio ofrece **Activar / Bloquear invitaciones /
  Inactivar** según su estado. El cambio se audita (`DOMICILIO_CAMBIAR_ESTATUS`).

### Exportación CSV (administración)
Route handlers protegidos por rol que devuelven CSV (con BOM para Excel):
- `/admin/accesos/export`
- `/admin/invitaciones/export`
- `/admin/auditoria/export`
Cada listado tiene su botón **"Exportar CSV"**. Respeta el aislamiento por fraccionamiento
(usan las queries existentes que validan rol y tenant). Util reutilizable en `src/lib/csv.ts`.

## Estado de Fase 1.4
| Tarea | Estado |
|---|---|
| Bloqueo de invitaciones por domicilio | ✅ |
| Exportación CSV (accesos, invitaciones, auditoría, **usuarios, domicilios**) | ✅ |
| Filtros en invitaciones (estatus/tipo) y accesos (resultado/método) | ✅ |
| Edición de usuario (nombre + reasignar domicilio de colono) | ✅ |
| Cancelación administrativa de invitación desde `/admin/invitaciones` | ✅ |
| Mensajes a grupos (todos / colonos / guardias) | ✅ |
| Detalle de domicilio (ver colonos/invitaciones/accesos asociados) | ✅ |
| Filtros por fecha/domicilio/guardia (en query/repositorio) | ✅ |
| Avisos segmentados (todos/colonos/guardias/administración/calle/domicilio) | ✅ |

### Implementado en el paquete "Fase 1.4 restante"
- **Detalle de domicilio** (`/admin/domicilios/[id]`): datos, colonos asociados,
  invitaciones y accesos recientes, estatus y acciones (activar / bloquear / inactivar).
  Tenant-scoped: devuelve *not found* si el domicilio no es del fraccionamiento del admin.
- **Filtros avanzados aplicados en query/repositorio** (no en memoria):
  - Invitaciones: estatus, tipo, **domicilio**, **fecha (desde/hasta)**.
  - Accesos: resultado, método, **domicilio**, **guardia**, **fecha (desde/hasta)**.
  - Las **fechas usan la zona horaria del fraccionamiento** (vía `zonedDayBounds` de
    `src/lib/time/zoned.ts`), no UTC — consistente con métricas y vigencias. La conversión se
    hace en la capa de query (`withTenantDateBounds`), solo si hay filtro de fecha.
  - Con límite razonable de listado (`ADMIN_LIST_LIMIT = 300`).
- **Avisos segmentados** (migración `0006`): nuevo `segmento`
  (`TODOS`/`COLONOS`/`GUARDIAS`/`ADMINISTRACION`/`CALLE`/`DOMICILIO`) + `segmento_calle`
  y `segmento_domicilio_id`. La UI muestra **"Dirigido a: …"**; colono/guardia solo ven
  los avisos que les corresponden (resuelto server-side vía `activeForAudience`). Se
  añadieron **edición** (`AVISO_EDITAR`) y **cambio de estatus** (`AVISO_CAMBIAR_ESTATUS`)
  de avisos, además de la creación (`AVISO_CREAR`), todos auditados.
- **Datos demo**: `npm run seed:lombardia` (ver `docs/SEED_LOMBARDIA.md`).

> **Decisión sobre RLS (condicionada):** no se modificaron las políticas RLS de
> `avisos_generales`. El aislamiento por fraccionamiento lo siguen garantizando las políticas
> existentes. La segmentación se acepta a nivel de query **bajo estas condiciones**:
> - **No debe existir lectura directa desde cliente/browser** a `avisos_generales`.
> - La **segmentación se aplica server-side** en las queries (`activeForAudience`), única ruta
>   de lectura de colono/guardia.
> - Si en el futuro se consulta `avisos_generales` desde el cliente, **habrá que endurecer RLS
>   por segmento o exponer una RPC dedicada** (server-side) para esa lectura.
>
> Endurecer RLS por calle/domicilio ahora agregaría riesgo de recursión vía las funciones
> helper sin beneficio real mientras se cumplan las condiciones anteriores.

> **Mejora futura (no bloqueante):** la UI de avisos renderiza siempre los campos *calle* y
> *domicilio*; un client component podría mostrar/ocultar el campo según el segmento elegido.
> Es seguro dejarlo así porque el **validador exige el campo correcto** según el segmento y el
> **servicio anula** (`null`) los campos que no correspondan (coherente con el constraint
> `avisos_segmento_target_check` de la migración `0006`).

### Implementado en la iteración previa
- **Cancelación administrativa** de invitaciones vigentes (`adminCancelInvitationAction`,
  el servicio valida rol/tenant y audita `INVITACION_CANCELAR`).
- **Filtros** por estatus/tipo en invitaciones y por resultado/método en accesos
  (vía `searchParams`).
- **Edición de usuario** (`updateUser`): nombre y reasignación de domicilio para colonos,
  con validación de tenant y tope de colonos; audita `USUARIO_EDITAR`.
- **Mensajes a grupos**: envío rápido a TODOS / COLONOS / GUARDIAS, expandido server-side.
- **Exportes** adicionales de usuarios y domicilios.

> Nota: el alta de usuarios/guardias, activar/desactivar y regenerar acceso ya se
> entregaron en Fase 1.1. La consulta de invitaciones, accesos y auditoría ya existía;
> aquí se añadió la exportación.

## Archivos (núcleo previo)
- `supabase/migrations/0005_domicilio_bloqueo.sql`
- `src/types/domain.ts`, `src/lib/validators/households.ts`,
  `src/lib/repositories/supabase/index.ts` (estatus de domicilio)
- `src/lib/services/invitations.service.ts`, `access.service.ts` (reglas de bloqueo)
- `src/app/admin/domicilios/page.tsx` (UI 3 estados)
- `src/lib/csv.ts` + `src/app/admin/{accesos,invitaciones,auditoria}/export/route.ts`

## Archivos (paquete "Fase 1.4 restante")
- `supabase/migrations/0006_avisos_segmentados.sql` (idempotente; no modifica RLS)
- `src/app/admin/domicilios/[id]/page.tsx` (detalle de domicilio)
- `src/server/queries/admin.ts` (`getAdminHouseholdDetail`, filtros en query)
- `src/lib/repositories/{contracts.ts,supabase/index.ts}` (filtros, `listByHousehold`,
  avisos: `findById`/`update`/`updateStatus`/`activeForAudience`)
- `src/lib/notices/audience.ts` (segmentación pura, testeable)
- `src/lib/validators/notices.ts`, `src/lib/services/admin.service.ts`,
  `src/server/actions/admin.actions.ts` (crear/editar/estatus de aviso)
- `src/server/queries/dashboard.ts` (colono/guardia leen avisos por audiencia)
- `src/app/admin/{invitaciones,accesos,avisos}/page.tsx` (UI de filtros y segmentación)
- Pruebas: `audience.test.ts`, `filters.test.ts`, `admin-household-detail.test.ts`,
  ampliación de `admin.service.test.ts`
- Demo: `scripts/seed-lombardia.mjs`, `docs/SEED_LOMBARDIA.md`

## Acción manual requerida
Aplicar en Supabase, en orden:
- `supabase/migrations/0005_domicilio_bloqueo.sql`
- `supabase/migrations/0006_avisos_segmentados.sql` (idempotente; segmentación de avisos)

> Sin la `0006` aplicada, las páginas de avisos fallarían al leer las nuevas columnas;
> el resto de la app degrada con normalidad.
