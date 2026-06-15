import { AppShell } from "@/components/layout/app-shell";
import { PreferencesProvider } from "@/features/preferences/preferences-provider";
import { requireRole } from "@/lib/auth/session";

export default async function ColonoLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole(["COLONO"]);

  return (
    <PreferencesProvider>
      <AppShell
        title="Portal colono"
        subtitle={actor.nombre}
        navItems={[
          { href: "/app", label: "Inicio" },
          { href: "/app/invitaciones", label: "Invitaciones" },
          { href: "/app/accesos", label: "Accesos" },
          { href: "/app/mensajes", label: "Mensajes" },
          { href: "/app/configuracion", label: "Personalizar" }
        ]}
      >
        {children}
      </AppShell>
    </PreferencesProvider>
  );
}
