# Casos de prueba de seguridad — Fase 1.2

Pruebas manuales recomendadas (requieren un Supabase con las migraciones `0001`–`0004`).

## Rate limiting de código numérico
1. En `/caseta/codigo`, captura **6 códigos inválidos** seguidos con el mismo guardia.
2. **Esperado:** a partir del 6.º intento la respuesta es genérica ("Demasiados intentos…").
3. Verifica en `eventos_seguridad` registros `INVALID_CODE_ATTEMPT` y un `RATE_LIMIT_CODE`.
4. La respuesta **no revela** si el código existe ni a qué domicilio pertenece.

## Rate limiting de QR
1. Escanea/ën­vía varios QR inválidos seguidos.
2. **Esperado:** mismo bloqueo genérico; eventos `INVALID_QR_ATTEMPT` y `RATE_LIMIT_QR`.

## Doble uso concurrente (single-use atómico)
1. Crea una invitación de **un día** (un solo uso).
2. Desde dos pestañas/dispositivos, abre la decisión de la misma invitación.
3. Permite acceso en ambas casi al mismo tiempo.
4. **Esperado:** solo una queda PERMITIDO; la otra recibe "La invitación ya fue utilizada".
   La invitación queda en estatus USADA una sola vez.

## Permitir invitación no vigente
1. Cancela (o deja expirar) una invitación.
2. Intenta "Permitir entrada" desde caseta.
3. **Esperado:** se bloquea con el motivo correspondiente; no se crea acceso PERMITIDO.

## Cross-tenant
1. Crea fraccionamientos A y B, con guardia en A e invitación en B.
2. Como guardia A, intenta decidir sobre la invitación de B (p. ej. manipulando el id).
3. **Esperado:** bloqueado; se registra `CROSS_TENANT_ATTEMPT` (CRITICAL); sin filtrar datos.

## Auditoría inmutable
1. Conéctate a la BD e intenta `UPDATE public.auditoria SET action='x';` o un `DELETE`.
2. **Esperado:** error "Tabla de solo escritura (append-only)". Lo mismo en `eventos_seguridad`.

## Usuario inactivo
1. Desactiva un usuario desde `/admin/usuarios`.
2. Intenta iniciar sesión con él.
3. **Esperado:** bloqueado con "Tu usuario se encuentra inactivo…".

## Fraccionamiento suspendido
1. Suspende un fraccionamiento desde superadmin.
2. Como colono de ese tenant, intenta crear una invitación.
3. **Esperado:** bloqueado ("Fraccionamiento suspendido o inactivo").
