import type { UserRole } from "@/types/domain";

export const ROLE_HOME: Record<UserRole, string> = {
  SUPERADMIN: "/superadmin",
  ADMINISTRACION: "/admin",
  GUARDIA: "/caseta",
  COLONO: "/app"
};

export function homeForRole(role: UserRole) {
  return ROLE_HOME[role];
}

export function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    SUPERADMIN: "Superadmin",
    ADMINISTRACION: "Administracion",
    GUARDIA: "Guardia",
    COLONO: "Colono"
  };

  return labels[role];
}
