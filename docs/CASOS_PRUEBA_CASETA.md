# Casos de prueba — Caseta (Fase 1.3)

Pruebas manuales del flujo de caseta (requiere migraciones `0001`–`0004` y un colono que
genere invitaciones).

## 1. Permitir por QR
1. Colono crea invitación de un día y descarga/comparte el QR.
2. En `/caseta/escanear`, escanea el QR.
3. **Esperado:** aparece la invitación con visitante, domicilio y placas; toca "Permitir".
4. Aparece confirmación "Entrada permitida"; el acceso queda en `/caseta/accesos`.

## 2. Fallback por código
1. Con la misma invitación, ve a `/caseta/codigo`.
2. Escribe los 6 dígitos (verifica que solo acepta números y hace autofocus).
3. Valida → permite → método queda como `CODIGO_NUMERICO`.

## 3. Anti-duplicado del escáner
1. En el escáner, mantén el mismo QR frente a la cámara unos segundos.
2. **Esperado:** se valida una sola vez (no se dispara repetidamente).

## 4. Rechazo con motivo obligatorio
1. Valida una invitación y toca "Rechazar acceso" sin elegir motivo.
2. **Esperado:** el navegador exige seleccionar un motivo antes de enviar.
3. Elige un motivo y rechaza → confirmación "Acceso rechazado"; queda registrado.

## 5. Búsqueda por nombre, domicilio y placas
1. En `/caseta/buscar`, busca por nombre del visitante → aparece.
2. Busca por calle/número del domicilio → aparece.
3. Busca por placas → aparece.
4. **Esperado:** no se muestran teléfono ni email del colono; máximo 20 resultados.

## 6. Detalle con validez real
1. Cancela una invitación (como colono o admin).
2. Ábrela desde búsqueda/listado en caseta.
3. **Esperado:** la pantalla muestra "Acceso no validado" con el motivo; **no** aparece el
   botón de permitir.

## 7. Invitación ya usada
1. Permite una invitación de un solo uso.
2. Intenta validarla de nuevo.
3. **Esperado:** "La invitación ya fue utilizada" / "Acceso no validado".

## 8. Registrar intento sin invitación
1. En `/caseta/buscar`, usa "Registrar intento no encontrado" con un nombre.
2. **Esperado:** queda en `/caseta/accesos` con resultado `INVITACION_NO_ENCONTRADA`.
