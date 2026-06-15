import { redirect } from "next/navigation";
import { AuthError, ForbiddenError } from "@/lib/errors";
import { homeForRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentUserProfile, UserRole } from "@/types/domain";

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("perfiles_usuario")
    .select("id, auth_user_id, fraccionamiento_id, domicilio_id, nombre, email, rol, estatus")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function requireAuth() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    throw new AuthError();
  }

  if (profile.estatus !== "ACTIVO") {
    throw new ForbiddenError("Tu usuario se encuentra inactivo. Contacta a administracion.");
  }

  return profile;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await requireAuth();
  if (!allowedRoles.includes(profile.rol)) {
    throw new ForbiddenError();
  }

  return profile;
}

export async function redirectIfAuthenticated() {
  const profile = await getCurrentUserProfile();
  if (profile?.estatus === "ACTIVO") {
    redirect(homeForRole(profile.rol));
  }
}

export async function redirectToRoleHome() {
  const profile = await requireAuth();
  redirect(homeForRole(profile.rol));
}
