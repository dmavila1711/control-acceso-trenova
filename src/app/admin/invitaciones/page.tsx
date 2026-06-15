import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationStatusBadge } from "@/components/ui/status-badges";
import { getAdminInvitations } from "@/server/queries/admin";
import { formatDateTime } from "@/lib/utils";

export default async function AdminInvitationsPage() {
  const invitations = await getAdminInvitations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitaciones del fraccionamiento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{invitation.nombre_visitante}</p>
              <InvitationStatusBadge status={invitation.estatus} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {invitation.tipo_visita.replaceAll("_", " ")} · {formatDateTime(invitation.fecha_inicio)} - {formatDateTime(invitation.fecha_fin)}
            </p>
          </div>
        ))}
        {invitations.length === 0 ? <p className="text-sm text-muted-foreground">Sin invitaciones.</p> : null}
      </CardContent>
    </Card>
  );
}
