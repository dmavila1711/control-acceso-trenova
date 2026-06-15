import { NoticeBanner } from "@/components/layout/notice-banner";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessStatusBadge, InvitationStatusBadge } from "@/components/ui/status-badges";
import { getAdminDashboard } from "@/server/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();
  const m = data.metrics;

  return (
    <div className="space-y-6">
      <NoticeBanner notices={data.notices} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Invitaciones hoy" value={m.invitacionesHoy} />
        <DashboardCard label="Accesos hoy" value={m.accesosHoy} />
        <DashboardCard label="Permitidos hoy" value={m.accesosPermitidosHoy} />
        <DashboardCard label="Rechazados hoy" value={m.accesosRechazadosHoy} />
        <DashboardCard label="Usuarios activos" value={m.usuariosActivos} />
        <DashboardCard label="Domicilios activos" value={m.domiciliosActivos} />
        <DashboardCard label="Validaciones QR" value={m.validacionesQrHoy} />
        <DashboardCard label="Codigos numericos" value={m.validacionesCodigoHoy} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.invitations.map((invitation) => (
              <div key={invitation.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{invitation.nombre_visitante}</p>
                  <InvitationStatusBadge status={invitation.estatus} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(invitation.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ultimos movimientos de caseta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentAccessLogs.map((access) => (
              <div key={access.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{access.nombre_visitante ?? "Sin visitante"}</p>
                  <AccessStatusBadge result={access.resultado} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(access.arrived_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
