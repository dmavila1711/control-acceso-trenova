import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function CasetaLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole(["GUARDIA", "ADMINISTRACION"]);

  return (
    <AppShell
      title="Panel de caseta"
      subtitle={actor.nombre}
      navItems={[
        { href: "/caseta", label: "Inicio" },
        { href: "/caseta/escanear", label: "Escanear QR" },
        { href: "/caseta/codigo", label: "Codigo" },
        { href: "/caseta/buscar", label: "Buscar" },
        { href: "/caseta/accesos", label: "Accesos" }
      ]}
    >
      {children}
    </AppShell>
  );
}
