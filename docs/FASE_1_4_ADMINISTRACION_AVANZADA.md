# Fase 1.4 — Administración avanzada

> Estado: **PARCIAL — núcleo entregado**. Build, lint, typecheck y pruebas en verde.
> Se priorizaron las capacidades de mayor valor; el resto queda listado como pendiente.

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
| CRUD detalle de domicilio (ver colonos/invitaciones/accesos asociados) | ⬜ |
| Filtros por fecha/domicilio/guardia y avisos segmentados (por rol/calle/domicilio) | ⬜ |

### Implementado en esta iteración
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

## Archivos
- `supabase/migrations/0005_domicilio_bloqueo.sql`
- `src/types/domain.ts`, `src/lib/validators/households.ts`,
  `src/lib/repositories/supabase/index.ts` (estatus de domicilio)
- `src/lib/services/invitations.service.ts`, `access.service.ts` (reglas de bloqueo)
- `src/app/admin/domicilios/page.tsx` (UI 3 estados)
- `src/lib/csv.ts` + `src/app/admin/{accesos,invitaciones,auditoria}/export/route.ts`

## Acción manual requerida
Aplicar `supabase/migrations/0005_domicilio_bloqueo.sql` en Supabase.
