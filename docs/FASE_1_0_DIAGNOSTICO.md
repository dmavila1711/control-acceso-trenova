# Fase 1.0 — Diagnóstico, validación y estabilización

> Estado: **COMPLETADA**. La base del proyecto está estable y lista para evolucionar.
> Fecha: 2026-06-18.

## Estado general

El proyecto compila, pasa lint, typecheck, pruebas y build. La arquitectura por capas
(UI → server actions/queries → servicios → repositorios → adaptador Supabase → RLS) está
respetada. Multitenancy, RLS, QR/código cifrado y auditoría están operativos.

## Checklist de validación

| Ítem | Estado |
|---|---|
| Rutas por rol (`/app`, `/caseta`, `/admin`, `/superadmin`, `/login`, `/auth/callback`) | ✅ |
| Layouts protegidos con `requireRole` | ✅ |
| Redirección por rol (`homeForRole`) | ✅ |
| Middleware de refresco de sesión | ✅ |
| Clientes Supabase (server / browser / admin) | ✅ |
| Helpers de auth y guards | ✅ |
| Servicios, repositorios, validadores Zod | ✅ |
| Tipos de dominio y de base de datos | ✅ |
| Migraciones `0001`, `0002`, `0003` | ✅ |
| PWA manifest + service worker | ✅ |
| RLS activo en tablas sensibles | ✅ |
| Funciones helper RLS `SECURITY DEFINER` | ✅ |
| Trigger de configuración por fraccionamiento | ✅ (corregido, ver abajo) |
| Trigger de límite de colonos | ✅ |
| Zona horaria por fraccionamiento | ✅ |
| QR opaco + HMAC + cifrado AES-GCM | ✅ |
| Auditoría de acciones críticas | ✅ |

## Riesgos corregidos durante 1.0

1. **Bug de RLS al crear fraccionamiento** — el trigger `ensure_fractionation_config`
   violaba RLS al insertar en `configuracion_fraccionamiento`. Corregido a
   `SECURITY DEFINER` en migración `0003_fix_config_trigger.sql`.
2. **Zona horaria en UTC** — los límites de día/mes se calculaban en la zona del
   servidor. Ahora se calculan en la zona del fraccionamiento (`src/lib/time/zoned.ts`,
   con pruebas). Columna `zona_horaria` en `configuracion_fraccionamiento` (`0002`).
3. **`decideAccess` sin revalidar** — un guardia podía marcar PERMITIDO sobre una
   invitación cancelada/expirada/usada. Ahora revalida antes de permitir.
4. **Orden de avisos** — se ordenaban por texto (ALTA quedaba al final). Corregido a
   orden por prioridad real.
5. **`env.ts` con acceso dinámico** — impedía la inyección de `NEXT_PUBLIC_*` en el
   cliente. Corregido a acceso literal.
6. **Búsqueda en caseta** — solo buscaba por nombre; ahora también por domicilio.

## Validación de aislamiento multitenant

Garantizado por RLS + guards en servicios:

- SUPERADMIN lee global; ADMINISTRACION/GUARDIA solo su fraccionamiento; COLONO solo su domicilio.
- Las búsquedas de invitación por QR/código filtran por `fraccionamiento_id` del guardia.
- Usuario inactivo bloqueado en login (`requireAuth` valida estatus ACTIVO).
- Fraccionamiento suspendido bloquea creación de invitaciones (`assertFractionationActive`).

> **Pendiente de cobertura automatizada:** las pruebas de aislamiento cross-tenant a nivel
> RLS requieren un entorno Supabase de prueba; quedan documentadas como casos manuales
> (ver Escenario 6 del prompt maestro) y se automatizarán en Fase 1.2.

## Comandos ejecutados

| Comando | Resultado |
|---|---|
| `npm run lint` | ✅ sin errores |
| `npm run typecheck` | ✅ sin errores |
| `npm run test` | ✅ 12/12 |
| `npm run build` | ✅ 30 rutas |

## Riesgos pendientes (hacia 1.1 / 1.2)

- Alta de usuarios desde admin (resuelto al inicio de 1.1).
- Rate limiting de código/QR (1.2).
- Inmutabilidad reforzada de auditoría (1.2).
- Pruebas automatizadas de RLS cross-tenant (1.2).

## Cómo continuar

Pasar a Fase 1.1 (cierre operativo): alta de usuarios sin Supabase manual, importación
CSV, QR como imagen y checklist de onboarding.
