import { requireRole } from "@/lib/auth/session";
import { createRepositories } from "@/lib/repositories/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { resolveTimeZone } from "@/lib/time/zoned";
import type { AuditRow } from "@/types/database";

export async function getSuperadminFractionations() {
  await requireRole(["SUPERADMIN"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);
  return repositories.fractionations.list();
}

export async function getSuperadminFractionationDetail(id: string) {
  await requireRole(["SUPERADMIN"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);
  const fractionation = await repositories.fractionations.findById(id);

  if (!fractionation) {
    return null;
  }

  const [users, households, invitations, accessLogs, messages] = await Promise.all([
    repositories.users.listByFractionation(id),
    repositories.households.listByFractionation(id),
    repositories.invitations.listByFractionation(id),
    repositories.accessLogs.listByFractionation(id),
    repositories.messages.listByFractionation(id)
  ]);

  return {
    fractionation,
    users,
    households,
    invitations,
    accessLogs,
    messages
  };
}

export async function getSuperadminMetrics() {
  await requireRole(["SUPERADMIN"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);
  return repositories.metrics.superadmin(resolveTimeZone());
}

export async function getSuperadminAudit() {
  await requireRole(["SUPERADMIN"]);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("auditoria")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) {
    throw new AppError(error.message);
  }

  return (data ?? []) as AuditRow[];
}
