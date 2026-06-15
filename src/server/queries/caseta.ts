import { requireRole } from "@/lib/auth/session";
import { createRepositories } from "@/lib/repositories/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";

export async function searchCasetaInvitations(query: string) {
  const actor = await requireRole(["GUARDIA", "ADMINISTRACION"]);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);

  if (!actor.fraccionamiento_id) {
    throw new AppError("Tu usuario no tiene fraccionamiento asignado.");
  }

  if (!query.trim()) {
    return [];
  }

  return repositories.invitations.searchActive(actor.fraccionamiento_id, query.trim());
}
