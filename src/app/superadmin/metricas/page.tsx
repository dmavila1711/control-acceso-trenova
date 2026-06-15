import { DashboardCard } from "@/components/ui/dashboard-card";
import { getSuperadminMetrics } from "@/server/queries/superadmin";

export default async function SuperadminMetricsPage() {
  const m = await getSuperadminMetrics();

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardCard label="Fraccionamientos totales" value={m.fraccionamientosTotales} />
      <DashboardCard label="Fraccionamientos activos" value={m.fraccionamientosActivos} />
      <DashboardCard label="Fraccionamientos suspendidos" value={m.fraccionamientosSuspendidos} />
      <DashboardCard label="Usuarios activos" value={m.usuariosActivos} />
      <DashboardCard label="Invitaciones hoy" value={m.invitacionesHoy} />
      <DashboardCard label="Invitaciones mes" value={m.invitacionesMes} />
      <DashboardCard label="Accesos hoy" value={m.accesosHoy} />
      <DashboardCard label="Accesos mes" value={m.accesosMes} />
      <DashboardCard label="Mensajes internos" value={m.mensajesInternos} />
    </section>
  );
}
