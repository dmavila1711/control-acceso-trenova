import { requireRole } from "@/lib/auth/session";
import { createRepositories } from "@/lib/repositories/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import type { AuditRow } from "@/types/database";

async function adminRepositories() {
  const actor = await requireRole(["ADMINISTRACION"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);

  if (!actor.fraccionamiento_id) {
    throw new AppError("Tu usuario no tiene fraccionamiento asignado.");
  }

  return {
    actor,
    repositories,
    fraccionamientoId: actor.fraccionamiento_id
  };
}

export async function getAdminHouseholds() {
  const { repositories, fraccionamientoId } = await adminRepositories();
  return repositories.households.listByFractionation(fraccionamientoId);
}

export async function getAdminUsers() {
  const { repositories, fraccionamientoId } = await adminRepositories();
  return repositories.users.listByFractionation(fraccionamientoId);
}

export async function getAdminInvitations() {
  const { repositories, fraccionamientoId } = await adminRepositories();
  return repositories.invitations.listByFractionation(fraccionamientoId);
}

export async function getAdminAccessLogs() {
  const { repositories, fraccionamientoId } = await adminRepositories();
  return repositories.accessLogs.listByFractionation(fraccionamientoId);
}

export async function getAdminNotices() {
  const { repositories, fraccionamientoId } = await adminRepositories();
  return repositories.notices.listByFractionation(fraccionamientoId);
}

export async function getAdminMessages() {
  const { repositories, fraccionamientoId } = await adminRepositories();
  return repositories.messages.listByFractionation(fraccionamientoId);
}

export async function getAdminAudit() {
  const { fraccionamientoId } = await adminRepositories();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("auditoria")
    .select("*")
    .eq("fraccionamiento_id", fraccionamientoId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new AppError(error.message);
  }

  return (data ?? []) as AuditRow[];
}
