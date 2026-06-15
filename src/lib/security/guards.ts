import { ForbiddenError } from "@/lib/errors";
import type { CurrentUserProfile, FractionationStatus, UserRole } from "@/types/domain";

export function assertRole(profile: CurrentUserProfile, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(profile.rol)) {
    throw new ForbiddenError();
  }
}

export function requireFractionationAccess(profile: CurrentUserProfile, fraccionamientoId: string) {
  if (profile.rol === "SUPERADMIN") {
    return;
  }

  if (!profile.fraccionamiento_id || profile.fraccionamiento_id !== fraccionamientoId) {
    throw new ForbiddenError("No tienes acceso a este fraccionamiento.");
  }
}

export function requireHouseholdAccess(profile: CurrentUserProfile, domicilioId: string) {
  if (profile.rol === "SUPERADMIN" || profile.rol === "ADMINISTRACION" || profile.rol === "GUARDIA") {
    return;
  }

  if (!profile.domicilio_id || profile.domicilio_id !== domicilioId) {
    throw new ForbiddenError("No tienes acceso a este domicilio.");
  }
}

export function assertFractionationActive(status: FractionationStatus) {
  if (status !== "ACTIVO") {
    throw new ForbiddenError("Fraccionamiento suspendido o inactivo.");
  }
}
