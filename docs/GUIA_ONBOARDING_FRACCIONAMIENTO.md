# Guía de onboarding de un fraccionamiento

Pasos para dejar un fraccionamiento listo para operar. El panel de administración
muestra un **checklist de "Puesta en marcha"** en su inicio que refleja este avance
(estados: LISTO, INCOMPLETO, REQUIERE_ATENCION, SUSPENDIDO).

## 1. Crear el fraccionamiento (superadmin)
En `/superadmin/fraccionamientos`. Al crearse se genera su configuración automáticamente
(incluye `zona_horaria` = `America/Mexico_City` por defecto).

## 2. Crear el usuario de administración
Con el script (necesita el UUID del fraccionamiento, visible en Supabase → Table Editor):

```bash
npm run crear-usuario -- --email admin@dominio.com --password "Clave1234" \
  --nombre "Administracion" --rol ADMINISTRACION --fraccionamiento <UUID>
```

## 3. Crear domicilios (administración)
En `/admin/domicilios`:
- **Uno por uno** con el formulario, o
- **Por CSV** (botón "Importar domicilios"): carga el archivo, revisa la vista previa
  (marca filas válidas y con error), y confirma. Solo se insertan las filas válidas.
  Formato en `docs/FORMATO_IMPORTACION_DOMICILIOS.csv`.

## 4. Crear guardias (administración)
En `/admin/guardias`: nombre, email y contraseña temporal. El guardia entra en `/login`.

## 5. Crear colonos (administración)
En `/admin/usuarios`: nombre, email, contraseña temporal, rol COLONO y domicilio.
Tope de 2 colonos activos por domicilio. (La importación masiva de colonos por CSV está
documentada como pendiente controlado — ver nota al final.)

## 6. Entregar accesos
La contraseña la define administración al crear el usuario y la comparte con la persona.
Si se olvida, en `/admin/usuarios` o `/admin/guardias` el botón **"Regenerar acceso"**
crea una nueva contraseña temporal para entregar.

## 7. Crear un aviso de bienvenida (opcional)
En `/admin/avisos`, con vigencia. Aparece como banner en colono y caseta.

## 8. Verificar el checklist
En `/admin` (inicio), el panel "Puesta en marcha" debe quedar en **LISTO** cuando hay
fraccionamiento activo, zona horaria, domicilios, colonos y guardias activos.

---

### Nota — importación de colonos por CSV (pendiente controlado)
Crear colonos masivamente implica crear su **cuenta de acceso (Auth)** por cada fila, lo
que requiere generar y distribuir contraseñas de forma segura. Para evitar entregar
credenciales de forma insegura en esta fase, la importación de colonos queda **pendiente
en modo controlado**: se hará uno por uno desde `/admin/usuarios` (o por script). La
estructura de importación (parser, preview, validación por fila, auditoría) ya existe y
se reutilizará. Formato propuesto en `docs/FORMATO_IMPORTACION_COLONOS.csv`.
