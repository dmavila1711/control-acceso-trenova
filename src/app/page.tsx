import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/roles";

export default async function HomePage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.estatus !== "ACTIVO") {
    redirect("/login");
  }

  redirect(homeForRole(profile.rol));
}
