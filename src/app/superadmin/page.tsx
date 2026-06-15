import Link from "next/link";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperadminDashboard } from "@/server/queries/dashboard";

export default async function SuperadminDashboardPage() {
  const data = await getSuperadminDashboard();
  const m = data.metrics;

  return (
    <div className="space-y-6">
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
