import Link from "next/link";
import { Hash, QrCode, Search } from "lucide-react";
import { NoticeBanner } from "@/components/layout/notice-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessStatusBadge, InvitationStatusBadge } from "@/components/ui/status-badges";
import { getCasetaDashboard } from "@/server/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function CasetaDashboardPage() {
  const data = await getCasetaDashboard();

  return (
    <div className="space-y-6">
      <NoticeBanner notices={data.notices} />
      <section className="grid gap-3 md:grid-cols-3">
        <Link href="/caseta/escanear" className="rounded-lg border bg-white p-4 shadow-soft hover:bg-secondary/50">
          <QrCode className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-3 font-semibold">Escanear QR</p>
        </Link>
        <Link href="/caseta/codigo" className="rounded-lg border bg-white p-4 shadow-soft hover:bg-secondary/50">
          <Hash className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-3 font-semibold">Capturar codigo</p>
        </Link>
        <Link href="/caseta/buscar" className="rounded-lg border bg-white p-4 shadow-soft hover:bg-secondary/50">
          <Search className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-3 font-semibold">Buscar invitacion</p>
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones vigentes de hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.todayInvitations.map((invitation) => (
              <Link key={invitation.id} href={`/caseta/invitacion/${invitation.id}`} className="block rounded-md border p-3 hover:bg-secondary/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{invitation.nombre_visitante}</p>
                  <InvitationStatusBadge status={invitation.estatus} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Hasta {formatDateTime(invitation.fecha_fin)}</p>
              </Link>
            ))}
            {data.todayInvitations.length === 0 ? <p className="text-sm text-muted-foreground">Sin invitaciones vigentes.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimos accesos</CardTitle>
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
            {data.recentAccessLogs.length === 0 ? <p className="text-sm text-muted-foreground">Aun no hay accesos.</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
