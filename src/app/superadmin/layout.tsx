import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole(["SUPERADMIN"]);

  return (
    <AppShell
      title="Superadmin SaaS"
      subtitle={actor.nombre}
      navItems={[
        { href: "/superadmin", label: "Dashboard" },
        { href: "/superadmin/fraccionamientos", label: "Fraccionamientos" },
        { href: "/superadmin/metricas", label: "Metricas" },
        { href: "/superadmin/auditoria", label: "Auditoria" }
      ]}
    >
      {children}
    </AppShell>
  );
}
