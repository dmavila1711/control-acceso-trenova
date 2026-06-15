import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole(["ADMINISTRACION"]);

  return (
    <AppShell
      title="Administracion"
      subtitle={actor.nombre}
      navItems={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/domicilios", label: "Domicilios" },
        { href: "/admin/usuarios", label: "Usuarios" },
        { href: "/admin/guardias", label: "Guardias" },
        { href: "/admin/invitaciones", label: "Invitaciones" },
        { href: "/admin/accesos", label: "Accesos" },
        { href: "/admin/avisos", label: "Avisos" },
        { href: "/admin/mensajes", label: "Mensajes" },
        { href: "/admin/auditoria", label: "Auditoria" }
      ]}
    >
      {children}
    </AppShell>
  );
}
