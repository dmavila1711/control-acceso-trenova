# Seed demo — Fraccionamiento Lombardia

Script idempotente para crear datos demo y probar los casos de uso sin dar de alta
cada usuario a mano desde Supabase.

> **Solo para local / demo / onboarding.** No debe ejecutarse como parte automática
> del deploy de producción. Usa `SUPABASE_SERVICE_ROLE_KEY` (server-only) y nunca debe
> ejecutarse desde el frontend.

## Qué crea (o reutiliza)

| Recurso | Datos |
|---|---|
| Fraccionamiento | `Lombardia` · dirección `Fraccionamiento Lombardia` · contacto `Sr Admin Lopez` · email `administrador@lombardia.com` · estatus `ACTIVO` |
| Domicilio demo | `Principal 1 Int. A` · referencia `Casa demo para pruebas` · estatus `ACTIVO` |
| Usuario ADMINISTRACION | `administrador@lombardia.com` · `Sr Admin Lopez` · sin domicilio |
| Usuario GUARDIA | `guardia@lombardia.com` · `Guardian Perez` · sin domicilio |
| Usuario COLONO | `colono@lombardia.com` · `Cristobal Colón` · domicilio demo |

Es **idempotente**: si el fraccionamiento, el domicilio, el usuario Auth o el perfil
ya existen, los reutiliza/actualiza sin duplicar. El modelo no tiene columna de
apellido: nombre y apellido van concatenados en `nombre`.

## Requisitos

En `.env.local` (o `.env`):

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

> El script nunca imprime la `SUPABASE_SERVICE_ROLE_KEY`.

## Uso

```bash
npm run seed:lombardia
```

Con contraseña personalizada:

```bash
DEMO_USER_PASSWORD="ClaveDemo123!" npm run seed:lombardia
```

La contraseña demo por defecto es `Trenova123!`. Al reutilizar un usuario existente,
el script le re-aplica la contraseña demo para garantizar el acceso.

## Resultado

Al terminar imprime las credenciales:

```txt
Fraccionamiento demo: Lombardia

Administrador:
administrador@lombardia.com
Trenova123!

Guardia:
guardia@lombardia.com
Trenova123!

Colono:
colono@lombardia.com
Trenova123!
```

Después de correrlo puedes iniciar sesión en `/login` con cualquiera de los tres
usuarios y la contraseña demo configurada.

## Notas técnicas

- Usa el Supabase Admin Client (`service_role`), que opera server-side y omite RLS por
  diseño; el script **no** desactiva RLS globalmente ni modifica migraciones.
- Crear el fraccionamiento dispara el trigger `ensure_fractionation_config`, que genera
  su configuración por defecto (zona horaria, etc.).
- Si la tabla `avisos_generales` aún no tiene la migración `0006` aplicada, el seed
  funciona igual (no toca avisos).
