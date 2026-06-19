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

## Pendiente de Fase 1.4 (siguiente iteración)
| Tarea | Estado |
|---|---|
| CRUD detalle de domicilio (editar, ver colonos/invitaciones/accesos asociados) | ⬜ |
| Filtros avanzados en invitaciones/accesos/auditoría (fecha, domicilio, guardia, tipo) | ⬜ |
| Edición de usuario (nombre, rol, reasignar domicilio de colono) | ⬜ |
| Cancelación administrativa de invitación desde `/admin/invitaciones` | ⬜ |
| Avisos segmentados (por rol/calle/domicilio) | ⬜ |
| Mensajes a grupos (todos los colonos, por rol) | ⬜ |

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
