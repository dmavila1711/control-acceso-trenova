import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperadminDashboard } from "@/server/queries/dashboard";

export default async function SuperadminDashboardPage() {
  const data = await getSuperadminDashboard();
  const m = data.metrics;

  return (
    <div className="space-y-6">
      {data.alerts.length > 0 ? (
        <Card className="border-amber-300">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <CardTitle>Tenants que requieren atencion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.alerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/superadmin/fraccionamientos/${alert.id}`}
                className="flex flex-col gap-1 rounded-md border p-3 hover:bg-secondary/60 md:flex-row md:items-center md:justify-between"
              >
                <p className="font-medium">{alert.nombre}</p>
                <div className="flex flex-wrap gap-1.5">
                  {alert.alerts.map((label) => (
                    <span key={label} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {label}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Fraccionamientos" value={m.fraccionamientosTotales} />
        <DashboardCard label="Activos" value={m.fraccionamientosActivos} />
        <DashboardCard label="Suspendidos" value={m.fraccionamientosSuspendidos} />
        <DashboardCard label="Usuarios activos" value={m.usuariosActivos} />
        <DashboardCard label="Invitaciones hoy" value={m.invitacionesHoy} />
        <DashboardCard label="Invitaciones mes" value={m.invitacionesMes} />
        <DashboardCard label="Accesos hoy" value={m.accesosHoy} />
        <DashboardCard label="Mensajes internos" value={m.mensajesInternos} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Uso por fraccionamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.fractionations.map((fractionation) => (
            <Link key={fractionation.id} href={`/superadmin/fraccionamientos/${fractionation.id}`} className="block rounded-md border p-3 hover:bg-secondary/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{fractionation.nombre}</p>
                <p className="text-sm text-muted-foreground">{fractionation.estatus}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
