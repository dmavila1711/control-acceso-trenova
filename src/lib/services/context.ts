import { requireRole } from "@/lib/auth/session";
import { createRepositories } from "@/lib/repositories/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export async function getServiceContext(roles: UserRole[]) {
  const actor = await requireRole(roles);
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);

  return {
    actor,
    repositories
  };
}
