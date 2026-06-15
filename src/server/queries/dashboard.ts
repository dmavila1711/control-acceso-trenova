import { requireRole } from "@/lib/auth/session";
import { createRepositories } from "@/lib/repositories/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { resolveTimeZone } from "@/lib/time/zoned";

export async function getColonoDashboard() {
  const actor = await requireRole(["COLONO"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);

  if (!actor.fraccionamiento_id || !actor.domicilio_id) {
    throw new AppError("Tu usuario no tiene domicilio asignado.");
  }

  const [notices, invitations, accessLogs, messages] = await Promise.all([
    repositories.notices.activeByFractionation(actor.fraccionamiento_id),
    repositories.invitations.listByHousehold(actor.domicilio_id),
    repositories.accessLogs.listByHousehold(actor.domicilio_id),
    repositories.messages.listForRecipient(actor.id)
  ]);

  return {
    actor,
    notices,
    invitations,
    activeInvitations: invitations.filter((invitation) => invitation.estatus === "VIGENTE"),
    accessLogs,
    recentAccessLogs: accessLogs.slice(0, 8),
    messages,
    recentMessages: messages.slice(0, 5)
  };
}

export async function getCasetaDashboard() {
  const actor = await requireRole(["GUARDIA", "ADMINISTRACION"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);

  if (!actor.fraccionamiento_id) {
    throw new AppError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const [notices, todayInvitations, recentAccessLogs] = await Promise.all([
    repositories.notices.activeByFractionation(actor.fraccionamiento_id),
    repositories.invitations.listActiveToday(actor.fraccionamiento_id),
    repositories.accessLogs.recentByFractionation(actor.fraccionamiento_id, 10)
  ]);

  return {
    actor,
    notices,
    todayInvitations,
    recentAccessLogs
  };
}

export async function getAdminDashboard() {
  const actor = await requireRole(["ADMINISTRACION"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);

  if (!actor.fraccionamiento_id) {
    throw new AppError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const config = await repositories.fractionations.getConfig(actor.fraccionamiento_id);
  const timeZone = resolveTimeZone(config?.zona_horaria);

  const [metrics, recentAccessLogs, invitations, notices] = await Promise.all([
    repositories.metrics.admin(actor.fraccionamiento_id, timeZone),
    repositories.accessLogs.recentByFractionation(actor.fraccionamiento_id, 8),
    repositories.invitations.listByFractionation(actor.fraccionamiento_id),
    repositories.notices.activeByFractionation(actor.fraccionamiento_id)
  ]);

  return {
    actor,
    metrics,
    recentAccessLogs,
    invitations: invitations.slice(0, 8),
    notices
  };
}

export async function getSuperadminDashboard() {
  const actor = await requireRole(["SUPERADMIN"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);

  const [metrics, fractionations] = await Promise.all([
    repositories.metrics.superadmin(resolveTimeZone()),
    repositories.fractionations.list()
  ]);

  return {
    actor,
    metrics,
    fractionations: fractionations.slice(0, 8)
  };
}
