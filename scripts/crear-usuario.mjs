#!/usr/bin/env node
// Crea un usuario en Supabase Auth y su perfil vinculado en perfiles_usuario.
// Usa la SUPABASE_SERVICE_ROLE_KEY (solo server-side, nunca en el cliente).
//
// Uso:
//   node scripts/crear-usuario.mjs \
//     --email superadmin@tu-dominio.com \
//     --password "ClaveSegura123" \
//     --nombre "Superadmin" \
//     --rol SUPERADMIN
//
// Roles y campos requeridos:
//   SUPERADMIN     -> sin fraccionamiento ni domicilio
//   ADMINISTRACION -> --fraccionamiento <uuid>
//   GUARDIA        -> --fraccionamiento <uuid>
//   COLONO         -> --fraccionamiento <uuid> --domicilio <uuid>
//
// Las variables se leen de .env.local (o .env). Requiere:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

function cargarEnv() {
  for (const archivo of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(archivo);
    } catch {
      // archivo opcional; ignoramos si no existe
    }
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

function fallar(mensaje) {
  console.error(`\n  Error: ${mensaje}\n`);
  process.exit(1);
}

cargarEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  fallar(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Configuralas en .env.local."
  );
}

const args = parseArgs(process.argv.slice(2));
const email = args.email?.trim();
const password = args.password;
const nombre = args.nombre?.trim();
const rol = args.rol?.trim().toUpperCase();
const fraccionamientoId = args.fraccionamiento ?? null;
const domicilioId = args.domicilio ?? null;

const ROLES = ["SUPERADMIN", "ADMINISTRACION", "GUARDIA", "COLONO"];

if (!email || !password || !nombre || !rol) {
  fallar("Faltan argumentos. Requeridos: --email --password --nombre --rol");
}

if (!ROLES.includes(rol)) {
  fallar(`Rol invalido "${rol}". Usa uno de: ${ROLES.join(", ")}`);
}

if (rol !== "SUPERADMIN" && !fraccionamientoId) {
  fallar(`El rol ${rol} requiere --fraccionamiento <uuid>`);
}

if (rol === "COLONO" && !domicilioId) {
  fallar("El rol COLONO requiere --domicilio <uuid>");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // 1) Crear (o reutilizar) el usuario en Supabase Auth.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  let authUserId = created?.user?.id ?? null;

  if (createError) {
    if (!/already been registered|already exists/i.test(createError.message)) {
      fallar(`No se pudo crear el usuario Auth: ${createError.message}`);
    }
    // Ya existe: lo buscamos por email para vincular el perfil.
    const { data: list } = await supabase.auth.admin.listUsers();
    const existente = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existente) {
      fallar("El usuario ya existe en Auth pero no se pudo recuperar su id.");
    }
    authUserId = existente.id;
    console.log("  Usuario Auth ya existia; se reutiliza su id.");
  }

  // 2) Crear (o actualizar) el perfil de dominio vinculado.
  const perfil = {
    auth_user_id: authUserId,
    nombre,
    email,
    rol,
    estatus: "ACTIVO",
    fraccionamiento_id: rol === "SUPERADMIN" ? null : fraccionamientoId,
    domicilio_id: rol === "COLONO" ? domicilioId : null
  };

  const { data: perfilData, error: perfilError } = await supabase
    .from("perfiles_usuario")
    .upsert(perfil, { onConflict: "auth_user_id" })
    .select("id")
    .single();

  if (perfilError) {
    fallar(`Usuario Auth creado, pero fallo el perfil: ${perfilError.message}`);
  }

  console.log("\n  Usuario listo:");
  console.log(`    email          : ${email}`);
  console.log(`    rol            : ${rol}`);
  console.log(`    auth_user_id   : ${authUserId}`);
  console.log(`    perfil_id      : ${perfilData.id}`);
  console.log("\n  Ya puede iniciar sesion en /login.\n");
}

main().catch((error) => {
  fallar(error?.message ?? String(error));
});
