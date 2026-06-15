import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";

export type ShellNavItem = {
  href: string;
  label: string;
};

export function AppShell({
  title,
  subtitle,
  navItems,
  children
}: {
  title: string;
  subtitle: string;
  navItems: ShellNavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-sm font-medium text-primary">Control de Acceso Trenova</p>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <form action={logoutAction}>
            <Button variant="secondary" size="sm" title="Cerrar sesion">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:px-6" aria-label="Principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
