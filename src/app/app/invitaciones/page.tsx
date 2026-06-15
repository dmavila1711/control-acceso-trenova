import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InvitationStatusBadge } from "@/components/ui/status-badges";
import { getColonoDashboard } from "@/server/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function ColonoInvitationsPage() {
  const data = await getColonoDashboard();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">Mis invitaciones</h2>
        <Link
          href="/app/invitaciones/nueva"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Crear invitacion
        </Link>
      </div>
      {data.invitations.length === 0 ? (
        <EmptyState title="Sin invitaciones" description="Crea una invitacion para generar QR y codigo numerico." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historial de invitaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.invitations.map((invitation) => (
              <Link key={invitation.id} href={`/app/invitaciones/${invitation.id}`} className="block rounded-md border p-3 hover:bg-secondary/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{invitation.nombre_visitante}</p>
                  <InvitationStatusBadge status={invitation.estatus} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(invitation.fecha_inicio)} - {formatDateTime(invitation.fecha_fin)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
