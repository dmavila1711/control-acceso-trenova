# Modelo de amenazas — Fase 1

Amenazas consideradas y mitigaciones implementadas en Control de Acceso Trenova.

| # | Amenaza | Mitigación actual | Pendiente |
|---|---|---|---|
| 1 | **QR compartido** a terceros | El QR es un token opaco con vigencia; las de un solo uso se marcan USADA de forma atómica tras el primer acceso | Límite de reusos configurable |
| 2 | **Código numérico adivinado** (fuerza bruta) | Rate limiting 5/min por guardia y 20/10min por fraccionamiento; respuesta genérica; eventos `RATE_LIMIT_*` e `INVALID_CODE_ATTEMPT` | Bloqueo progresivo por dispositivo |
| 3 | **Guardia malicioso** | Solo ve datos de su fraccionamiento (RLS + filtros); toda decisión auditada; cross-tenant bloqueado y registrado | Sesión con cierre por inactividad (1.3) |
| 4 | **Admin curioso** | RLS limita a su fraccionamiento; no puede crear SUPERADMIN; no puede leer otros tenants; auditoría inmutable | RLS de UPDATE por columna |
| 5 | **Usuario inactivo** | `requireAuth` bloquea login si estatus ≠ ACTIVO | — |
| 6 | **Fraccionamiento suspendido** | `assertFractionationActive` bloquea creación de invitaciones; validación marca `FRACCIONAMIENTO_SUSPENDIDO` | Registrar evento dedicado |
| 7 | **Sesión abierta en caseta** | Sesión vía cookies con refresh en middleware | Cierre por inactividad / bloqueo de pantalla (1.3) |
| 8 | **Intento cross-tenant** | Búsquedas filtradas por `fraccionamiento_id`; `decideAccess` bloquea y registra `CROSS_TENANT_ATTEMPT` (CRITICAL) | Alertas en superadmin (1.5) |
| 9 | **Visitante insistente** (reintentos) | Cada intento no encontrado se registra en `accesos` y como evento de seguridad | — |
| 10 | **Pérdida del celular del colono** | El QR/código tiene vigencia y se puede cancelar; admin puede regenerar acceso del usuario | Revocación remota de invitaciones en lote |
| 11 | **Manipulación de auditoría** | `auditoria` y `eventos_seguridad` son append-only (triggers bloquean UPDATE/DELETE) | — |
| 12 | **Exposición de secretos** | `service_role` solo server-side; QR/código nunca en texto plano (HMAC + AES-GCM); no se registran crudos | — |

## Principios
- **Mínima revelación:** los errores de validación no distinguen entre "no existe",
  "expiró" o "otro fraccionamiento" más de lo necesario para operar.
- **Defensa en profundidad:** RLS + guards en servicios + validación Zod.
- **Trazabilidad:** todo movimiento crítico queda en auditoría inmutable; los abusos en
  `eventos_seguridad`.
