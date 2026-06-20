#!/usr/bin/env node
// Datos demo para Control de Acceso Trenova: crea (o reutiliza) el fraccionamiento
// "Lombardia" con un domicilio demo y tres usuarios (ADMINISTRACION, GUARDIA, COLONO)
// para probar los casos de uso sin crear cada usuario a mano desde Supabase.
//
// SOLO para local/demo/onboarding. No forma parte del deploy de produccion.
// Usa la SUPABASE_SERVICE_ROLE_KEY (server-only, nunca en el cliente). El script
// es idempotente: si algo ya existe, lo reutiliza/actualiza sin duplicar.
//
// Uso:
//   npm run seed:lombardia
//   DEMO_USER_PASSWORD="OtraClave123!" npm run seed:lombardia
//
// Variables requeridas (en .env.local o .env):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "Trenova123!";

const FRACCIONAMIENTO = {
  nombre: "Lombardia",
  direccion: "Fraccionamiento Lombardia",
  contacto_admin: "Sr Admin Lopez",
  email_contacto: "administrador@lombardia.com"
};

const DOMICILIO = {
  calle: "Principal",
  numero_exterior: "1",
  numero_interior: "A",
  referencia: "Casa demo para pruebas"
};

// El modelo no tiene columna de apellido: nombre y apellido van concatenados en `nombre`.
const USUARIOS = [
  { email: "administrador@lombardia.com", nombre: "Sr Admin Lopez", rol: "ADMINISTRACION", conDomicilio: false },
  { email: "guardia@lombardia.com", nombre: "Guardian Perez", rol: "GUARDIA", conDomicilio: false },
  { email: "colono@lombardia.com", nombre: "Cristobal Colón", rol: "COLONO", conDomicilio: true }
];

function loadEnv() {
  for (const archivo of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(archivo);
    } catch {
      // archivo opcional
    }
  }
}

function fail(mensaje) {
  console.error(`\n  Error: ${mensaje}\n`);
  process.exit(1);
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  fail("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Configuralas en .env.local.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function logStep(accion, detalle) {
  // accion: "creado" | "reutilizado" | "actualizado"
  console.log(`  [${accion.padEnd(12)}] ${detalle}`);
}

async function ensureFraccionamiento() {
  const { data: existing, error } = await supabase
    .from("fraccionamientos")
    .select("id, estatus")
    .eq("nombre", FRACCIONAMIENTO.nombre)
    .maybeSingle();
  if (error) fail(`No se pudo consultar el fraccionamiento: ${error.message}`);

  if (existing) {
    if (existing.estatus !== "ACTIVO") {
      const { error: updError } = await supabase
        .from("fraccionamientos")
        .update({ estatus: "ACTIVO" })
        .eq("id", existing.id);
      if (updError) fail(`No se pudo activar el fraccionamiento: ${updError.message}`);
      logStep("actualizado", `Fraccionamiento "${FRACCIONAMIENTO.nombre}" -> ACTIVO`);
    } else {
      logStep("reutilizado", `Fraccionamiento "${FRACCIONAMIENTO.nombre}"`);
    }
    return existing.id;
  }

  const { data: created, error: insError } = await supabase
    .from("fraccionamientos")
    .insert({ ...FRACCIONAMIENTO, estatus: "ACTIVO" })
    .select("id")
    .single();
  if (insError) fail(`No se pudo crear el fraccionamiento: ${insError.message}`);
  logStep("creado", `Fraccionamiento "${FRACCIONAMIENTO.nombre}"`);
  return created.id;
}

async function ensureDomicilio(fraccionamientoId) {
  const { data: existing, error } = await supabase
    .from("domicilios")
    .select("id, estatus")
    .eq("fraccionamiento_id", fraccionamientoId)
    .eq("calle", DOMICILIO.calle)
    .eq("numero_exterior", DOMICILIO.numero_exterior)
    .eq("numero_interior", DOMICILIO.numero_interior)
    .maybeSingle();
  if (error) fail(`No se pudo consultar el domicilio: ${error.message}`);

  if (existing) {
    if (existing.estatus !== "ACTIVO") {
      const { error: updError } = await supabase
        .from("domicilios")
        .update({ estatus: "ACTIVO" })
        .eq("id", existing.id);
      if (updError) fail(`No se pudo activar el domicilio: ${updError.message}`);
      logStep("actualizado", `Domicilio ${DOMICILIO.calle} ${DOMICILIO.numero_exterior} Int. ${DOMICILIO.numero_interior} -> ACTIVO`);
    } else {
      logStep("reutilizado", `Domicilio ${DOMICILIO.calle} ${DOMICILIO.numero_exterior} Int. ${DOMICILIO.numero_interior}`);
    }
    return existing.id;
  }

  const { data: created, error: insError } = await supabase
    .from("domicilios")
    .insert({ fraccionamiento_id: fraccionamientoId, ...DOMICILIO, estatus: "ACTIVO" })
    .select("id")
    .single();
  if (insError) fail(`No se pudo crear el domicilio: ${insError.message}`);
  logStep("creado", `Domicilio ${DOMICILIO.calle} ${DOMICILIO.numero_exterior} Int. ${DOMICILIO.numero_interior}`);
  return created.id;
}

async function ensureAuthUser(email) {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true
  });

  if (!error && created?.user?.id) {
    return { id: created.user.id, reused: false };
  }

  if (error && !/already been registered|already exists|already registered/i.test(error.message)) {
    fail(`No se pudo crear el usuario Auth ${email}: ${error.message}`);
  }

  // Ya existe: lo buscamos por email y le re-aplicamos la contrasena demo.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) fail(`No se pudo listar usuarios Auth: ${listError.message}`);
  const found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!found) fail(`El usuario ${email} ya existe en Auth pero no se pudo recuperar su id.`);

  const { error: updError } = await supabase.auth.admin.updateUserById(found.id, {
    password: DEMO_PASSWORD,
    email_confirm: true
  });
  if (updError) fail(`No se pudo actualizar la contrasena demo de ${email}: ${updError.message}`);
  return { id: found.id, reused: true };
}

async function ensurePerfil({ authUserId, email, nombre, rol, fraccionamientoId, domicilioId }) {
  const perfil = {
    auth_user_id: authUserId,
    nombre,
    email,
    rol,
    estatus: "ACTIVO",
    fraccionamiento_id: fraccionamientoId,
    domicilio_id: domicilioId
  };

  const { error } = await supabase
    .from("perfiles_usuario")
    .upsert(perfil, { onConflict: "auth_user_id" })
    .select("id")
    .single();
  if (error) fail(`No se pudo crear/actualizar el perfil de ${email}: ${error.message}`);
}

async function main() {
  console.log("\n  Seed demo — Control de Acceso Trenova (Lombardia)\n");

  const fraccionamientoId = await ensureFraccionamiento();
  const domicilioId = await ensureDomicilio(fraccionamientoId);

  for (const usuario of USUARIOS) {
    const { id: authUserId, reused } = await ensureAuthUser(usuario.email);
    await ensurePerfil({
      authUserId,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      fraccionamientoId,
      domicilioId: usuario.conDomicilio ? domicilioId : null
    });
    logStep(reused ? "reutilizado" : "creado", `Usuario ${usuario.rol}: ${usuario.email}`);
  }

  console.log("\n----------------------------------------");
  console.log(`Fraccionamiento demo: ${FRACCIONAMIENTO.nombre}`);
  console.log("");
  console.log("Administrador:");
  console.log("administrador@lombardia.com");
  console.log(DEMO_PASSWORD);
  console.log("");
  console.log("Guardia:");
  console.log("guardia@lombardia.com");
  console.log(DEMO_PASSWORD);
  console.log("");
  console.log("Colono:");
  console.log("colono@lombardia.com");
  console.log(DEMO_PASSWORD);
  console.log("----------------------------------------\n");
}

main().catch((error) => {
  fail(error?.message ?? String(error));
});
