# Fase 1.5 — Observabilidad, soporte y salud del tenant

> Estado: **PARCIAL — núcleo entregado**. Build, lint, typecheck y pruebas en verde.

## Implementado

### Salud del fraccionamiento (administración)
- **Checklist de puesta en marcha** (de Fase 1.1) en `/admin`: estado LISTO / INCOMPLETO /
  REQUIERE_ATENCION / SUSPENDIDO con domicilios, colonos, guardias, avisos, etc.
- **Indicador de seguridad:** tarjeta "Intentos fallidos (24h)" en el dashboard, contando
  eventos de seguridad (`INVALID_*`, `RATE_LIMIT_*`, `CROSS_TENANT_ATTEMPT`).
- Métricas operativas existentes: invitaciones, accesos permitidos/rechazados,
  validaciones por QR/código, usuarios y domicilios activos.

### Salud global (superadmin)
- **Alertas por tenant** en `/superadmin`: panel "Tenants que requieren atención" que marca
  fraccionamientos **suspendidos**, **en configuración**, **sin domicilios activos** o
  **sin guardias activos**, con enlace directo al detalle del fraccionamiento.
- Métricas globales existentes (fraccionamientos activos/suspendidos, usuarios,
  invitaciones/accesos hoy y mes, mensajes internos).

## Pendiente de Fase 1.5 (siguiente iteración)
| Tarea | Estado |
|---|---|
| Dashboard de salud detallado por fraccionamiento (`/superadmin/fraccionamientos/[id]`) | ⬜ |
| Métricas por periodo (series por día) | ⬜ |
| Tabla/registro dedicado de errores operativos | 🟡 base: `eventos_seguridad` reutilizable |
| Más alertas (sin actividad reciente, zona no configurada, usuarios pendientes) | ⬜ |
| Exportes adicionales (usuarios, domicilios, métricas) | ⬜ |

## Archivos
- `src/server/queries/dashboard.ts` (alertas de superadmin + intentos fallidos en admin)
- `src/app/superadmin/page.tsx` (panel de alertas)
- `src/app/admin/page.tsx` (tarjeta de intentos fallidos)
- `src/lib/security/events.ts` (`countSecurityFailures`)

## Sin acción manual
Esta fase no agrega migraciones (reutiliza `eventos_seguridad` de la Fase 1.2).
