import { requireRole } from "@/lib/auth/session";
import type { UserRole } from "@/types/domain";

export async function RoleGuard({
  roles,
  children
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  await requireRole(roles);
  return <>{children}</>;
}
