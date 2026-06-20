import { requireRole } from "@/lib/auth/session";
import { createRepositories } from "@/lib/repositories/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { resolveTimeZone, zonedDayBounds } from "@/lib/time/zoned";
import type {
  AccessLogListFilters,
  InvitationListFilters,
  Repositories
} from "@/lib/repositories/contracts";
import type { AuditRow } from "@/types/database";

// Convierte los filtros de fecha (YYYY-MM-DD) a limites de dia en la zona horaria
// del fraccionamiento (igual que metricas y vigencias), no en UTC. Solo consulta
// la configuracion si hay filtro de fecha.
async function withTenantDateBounds<T extends { desde?: string; hasta?: string }>(
  repositories: Repositories,
  fraccionamientoId: string,
  filters?: T
): Promise<T | undefined> {
  if (!filters || (!filters.desde && !filters.hasta)) {
    return filters;
  }
  const config = await repositories.fractionations.getConfig(fraccionamientoId);
  const timeZone = resolveTimeZone(config?.zona_horaria);
  return {
    ...filters,
    desde: filters.desde ? zonedDayBounds(filters.desde, timeZone).start.toISOString() : undefined,
    hasta: filters.hasta ? zonedDayBounds(filters.hasta, timeZone).end.toISOString() : undefined
  };
}

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

// Detalle completo de un domicilio. Devuelve null si no existe o no pertenece al
// fraccionamiento del administrador (tenant-scoped, defensa en profundidad además de RLS).
export async function getAdminHouseholdDetail(id: string) {
  const { repositories, fraccionamientoId } = await adminRepositories();
  const household = await repositories.households.findById(id);
  if (!household || household.fraccionamiento_id !== fraccionamientoId) {
    return null;
  }

  const [colonos, invitations, accessLogs] = await Promise.all([
    repositories.users.listByHousehold(id),
    repositories.invitations.listByHousehold(id),
    repositories.accessLogs.listByHousehold(id)
  ]);

  return {
    household,
    colonos,
    invitations: invitations.slice(0, 10),
    accessLogs: accessLogs.slice(0, 10),
    counts: {
      colonos: colonos.length,
      invitaciones: invitations.length,
      accesos: accessLogs.length
    }
  };
}

export async function getAdminInvitations(filters?: InvitationListFilters) {
  const { repositories, fraccionamientoId } = await adminRepositories();
  // Filtrado en capa de query/repositorio (no en memoria); fechas en zona del tenant.
  const scoped = await withTenantDateBounds(repositories, fraccionamientoId, filters);
  return repositories.invitations.listByFractionation(fraccionamientoId, scoped);
}

export async function getAdminAccessLogs(filters?: AccessLogListFilters) {
  const { repositories, fraccionamientoId } = await adminRepositories();
  // Filtrado en capa de query/repositorio (no en memoria); fechas en zona del tenant.
  const scoped = await withTenantDateBounds(repositories, fraccionamientoId, filters);
  return repositories.accessLogs.listByFractionation(fraccionamientoId, scoped);
}

export async function getAdminNotices() {
  const { repositories, fraccionamientoId } = await adminRepositories();
  return repositories.notices.listByFractionation(fraccionamientoId);
}

export async function getAdminMessages() {
  const { repositories, fraccionamientoId } = await adminRepositories();
  return repositories.messages.listByFractionation(fraccionamientoId);
}

export type TenantReadinessItem = { label: string; ok: boolean; detail: string };
export type TenantReadiness = {
  estado: "LISTO" | "INCOMPLETO" | "REQUIERE_ATENCION" | "SUSPENDIDO";
  items: TenantReadinessItem[];
};

// Checklist de puesta en marcha del fraccionamiento. Indica si el tenant esta
// listo para operar o que falta configurar.
export async function getTenantReadiness(): Promise<TenantReadiness> {
  const { repositories, fraccionamientoId } = await adminRepositories();

  const [fractionation, config, users, households, notices, lastAccess, invitations] = await Promise.all([
    repositories.fractionations.findById(fraccionamientoId),
    repositories.fractionations.getConfig(fraccionamientoId),
    repositories.users.listByFractionation(fraccionamientoId),
    repositories.households.listByFractionation(fraccionamientoId),
    repositories.notices.activeByFractionation(fraccionamientoId),
    repositories.accessLogs.recentByFractionation(fraccionamientoId, 1),
    repositories.invitations.listByFractionation(fraccionamientoId)
  ]);

  const colonosActivos = users.filter((u) => u.rol === "COLONO" && u.estatus === "ACTIVO").length;
  const guardiasActivos = users.filter((u) => u.rol === "GUARDIA" && u.estatus === "ACTIVO").length;
  const domiciliosActivos = households.filter((h) => h.estatus === "ACTIVO").length;
  const fraccActivo = fractionation?.estatus === "ACTIVO";
  const zonaSet = Boolean(config?.zona_horaria);

  const items: TenantReadinessItem[] = [
    { label: "Fraccionamiento activo", ok: fraccActivo, detail: fractionation?.estatus ?? "—" },
    { label: "Zona horaria configurada", ok: zonaSet, detail: config?.zona_horaria ?? "Sin configurar" },
    { label: "Domicilios activos", ok: domiciliosActivos > 0, detail: String(domiciliosActivos) },
    { label: "Colonos activos", ok: colonosActivos > 0, detail: String(colonosActivos) },
    { label: "Guardias activos", ok: guardiasActivos > 0, detail: String(guardiasActivos) },
    { label: "Avisos vigentes", ok: notices.length > 0, detail: String(notices.length) },
    { label: "Invitaciones generadas", ok: invitations.length > 0, detail: String(invitations.length) },
    { label: "Accesos registrados", ok: lastAccess.length > 0, detail: lastAccess.length > 0 ? "Si" : "Aun no" }
  ];

  let estado: TenantReadiness["estado"];
  if (fractionation?.estatus === "SUSPENDIDO") {
    estado = "SUSPENDIDO";
  } else if (domiciliosActivos > 0 && colonosActivos > 0 && guardiasActivos > 0 && fraccActivo && zonaSet) {
    estado = "LISTO";
  } else if (!fraccActivo) {
    estado = "REQUIERE_ATENCION";
  } else {
    estado = "INCOMPLETO";
  }

  return { estado, items };
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
