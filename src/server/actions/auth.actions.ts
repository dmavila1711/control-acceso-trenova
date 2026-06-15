"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth/roles";
import { getPublicEnv } from "@/lib/env";
import { formDataObject } from "@/server/actions/helpers";
import type { ActionResponse, UserRole, UserStatus } from "@/types/domain";

type LoginState = ActionResponse<undefined>;

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const values = formDataObject(formData);
  const email = String(values.email ?? "").trim();
  const password = String(values.password ?? "");
  const supabase = await createSupabaseServerClient();

  if (!email || !password) {
    return { ok: false, error: "Escribe email y contrasena." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: "No pudimos iniciar sesion con esos datos." };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("perfiles_usuario")
    .select("rol, estatus")
    .eq("auth_user_id", user?.id ?? "")
    .maybeSingle();
  const profile = data as { rol: UserRole; estatus: UserStatus } | null;

  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: "No encontramos un perfil activo para este usuario." };
  }

  if (profile.estatus !== "ACTIVO") {
    await supabase.auth.signOut();
    return { ok: false, error: "Tu usuario se encuentra inactivo. Contacta a administracion." };
  }

  redirect(homeForRole(profile.rol));
}

export async function magicLinkAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createSupabaseServerClient();

  if (!email) {
    return { ok: false, error: "Escribe tu email." };
  }

  const { appUrl } = getPublicEnv();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`
    }
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined, message: "Te enviamos un enlace de acceso." };
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
