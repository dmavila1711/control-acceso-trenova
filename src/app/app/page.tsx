import Link from "next/link";
import { Plus } from "lucide-react";
import { NoticeBanner } from "@/components/layout/notice-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AccessStatusBadge, InvitationStatusBadge } from "@/components/ui/status-badges";
import { getColonoDashboard } from "@/server/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function ColonoDashboardPage() {
  const data = await getColonoDashboard();

  return (
    <div className="space-y-6">
      <NoticeBanner notices={data.notices} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inicio</h2>
          <p className="text-sm text-muted-foreground">Invitaciones, accesos y mensajes de tu domicilio.</p>
        </div>
        <Link
          href="/app/invitaciones/nueva"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Crear invitacion
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones vigentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activeInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes invitaciones vigentes.</p>
            ) : (
              data.activeInvitations.slice(0, 5).map((invitation) => (
                <Link key={invitation.id} href={`/app/invitaciones/${invitation.id}`} className="block rounded-md border p-3 hover:bg-secondary/60">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{invitation.nombre_visitante}</p>
                    <InvitationStatusBadge status={invitation.estatus} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Vigente hasta {formatDateTime(invitation.fecha_fin)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimos accesos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentAccessLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay accesos registrados.</p>
            ) : (
              data.recentAccessLogs.map((access) => (
                <div key={access.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{access.nombre_visitante ?? "Sin visitante"}</p>
                    <AccessStatusBadge result={access.resultado} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(access.arrived_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {data.recentMessages.length === 0 ? (
        <EmptyState title="Sin mensajes recientes" description="Los mensajes internos apareceran aqui." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mensajes recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentMessages.map((message) => (
              <div key={message.id} className="rounded-md border p-3">
                <p className="font-medium">{message.titulo}</p>
                <p className="mt-1 text-sm text-muted-foreground">{message.mensaje}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
