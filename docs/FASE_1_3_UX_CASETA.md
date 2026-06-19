# Fase 1.3 — UX fuerte para caseta

> Estado: **COMPLETADA**. Build, lint, typecheck y pruebas en verde. La caseta está
> pensada para operar bajo presión: mala cámara, poca luz, gente esperando, guardia no
> técnico.

## Qué se implementó

### 1. Home de caseta con acciones grandes
`/caseta`: tres botones grandes y táctiles (Escanear QR / Capturar código / Buscar), el
principal en color sólido. Debajo, avisos vigentes, invitaciones válidas de hoy y accesos
recientes. El nombre del guardia y el panel salen del layout.

### 2. Escáner optimizado (`/caseta/escanear`)
- Estado visible "Validando QR…" durante la verificación.
- **Anti-duplicado:** ignora el mismo QR si se vuelve a leer en menos de 4 s (evita
  validaciones repetidas mientras la cámara enfoca).
- **Fallback claro** en un desplegable "No puedo escanear": capturar QR manual, ir a
  capturar código o buscar.
- Mensaje de error destacado y no técnico.

### 3. Captura de código optimizada (`/caseta/codigo`)
- Input **grande**, centrado, con espaciado tipo OTP, `autofocus`, teclado numérico
  (`inputMode="numeric"`), `autocomplete="one-time-code"`.
- **Solo dígitos:** limpia cualquier carácter pegado que no sea número y limita a 6.
- Botón de validar grande; errores en banner claro; accesos rápidos a Escanear/Buscar.

### 4. Búsqueda segura (`/caseta/buscar`)
- Busca por **nombre del visitante, domicilio (calle/número) o placas**.
- Solo invitaciones **vigentes**, **limitadas a 20** resultados.
- Muestra lo necesario: visitante, tipo, placas y vigencia. **No** expone teléfono ni
  email del colono.
- Panel para registrar intento sin invitación.

### 5. Pantalla de decisión (`AccessDecisionPanel`)
- Para invitación válida: tarjeta con visitante, tipo, **domicilio**, **placas** y
  vigencia; botones grandes **Permitir** / **Rechazar**.
- **Rechazo con motivo obligatorio** (selección rápida): visitante no coincide, expirada,
  cancelada, datos incorrectos, instrucción de colono/admin, otro.
- **Confirmación grande** tras decidir (ícono + "Entrada permitida" / "Acceso rechazado")
  y botón "Atender siguiente".
- Para invitación inválida: tarjeta roja con el motivo y botón "Volver". Nunca muestra el
  botón de permitir sobre algo no vigente.

### 6. Detalle operativo con validez real
`/caseta/invitacion/[id]` ya **no asume VALIDA**: calcula el estado real (vigencia +
estatus) y muestra la decisión solo si corresponde. El servidor revalida de nuevo al
decidir (defensa en profundidad de Fase 1.2).

### 7. Accesibilidad y operación real
- Botones grandes (h-12/h-14) y objetivos táctiles amplios.
- Estados comunicados por **color y texto** (no solo color).
- Mensajes en español, claros y no técnicos.
- Funciona en celular y tablet, usable con una mano.

## Acceso sin invitación / EN_CASETA
- **SIN_INVITACION:** el guardia usa "Registrar intento no encontrado" en `/caseta/buscar`;
  queda en `accesos` con resultado `INVITACION_NO_ENCONTRADA` y auditado.
- **EN_CASETA:** tipo de autorización para visitas que se autorizan en el momento; hoy se
  registran y validan como el resto. La autorización en tiempo real (avisar al colono) se
  deja preparada para una fase posterior (sin WhatsApp/push reales en Fase 1).

## Diferido
- **Cierre de sesión por inactividad / bloqueo de pantalla en caseta:** pendiente; requiere
  un proveedor de inactividad y pruebas en tablet compartida. Documentado en el modelo de
  amenazas (amenaza 7).

## Archivos
- `src/app/caseta/page.tsx` (home), `src/app/caseta/buscar/page.tsx`,
  `src/app/caseta/invitacion/[id]/page.tsx`
- `src/features/access/access-decision-panel.tsx`, `numeric-code-form.tsx`
- `src/components/scanner/qr-scanner-panel.tsx`
- `src/server/actions/access.actions.ts` (decisión con estado/confirmación)
- `src/lib/services/access.service.ts`, `src/types/domain.ts` (domicilio + placas)
- `src/lib/repositories/supabase/index.ts` (búsqueda por placas)

## Pruebas
- `npm run lint`, `npm run typecheck`, `npm run test` (17), `npm run build` → ✅.
