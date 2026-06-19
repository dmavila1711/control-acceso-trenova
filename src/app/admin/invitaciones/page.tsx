import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { InvitationStatusBadge } from "@/components/ui/status-badges";
import { adminCancelInvitationAction } from "@/server/actions/invitations.actions";
import { getAdminInvitations } from "@/server/queries/admin";
import { INVITATION_STATUSES, VISIT_TYPES } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";

export default async function AdminInvitationsPage({
  searchParams
}: {
  searchParams: Promise<{ estatus?: string; tipo?: string }>;
}) {
  const params = await searchParams;
  const invitations = await getAdminInvitations({ estatus: params.estatus, tipo: params.tipo });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Invitaciones del fraccionamiento</CardTitle>
        <a
          href="/admin/invitaciones/export"
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
        >
          Exportar CSV
        </a>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="estatus" className="text-xs text-muted-foreground">Estatus</label>
            <Select id="estatus" name="estatus" defaultValue={params.estatus ?? ""}>
              <option value="">Todos</option>
              {INVITATION_STATUSES.map((estatus) => (
                <option key={estatus} value={estatus}>{estatus.replaceAll("_", " ")}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="tipo" className="text-xs text-muted-foreground">Tipo</label>
            <Select id="tipo" name="tipo" defaultValue={params.tipo ?? ""}>
              <option value="">Todos</option>
              {VISIT_TYPES.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo.replaceAll("_", " ")}</option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
        </form>

        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{invitation.nombre_visitante}</p>
                <InvitationStatusBadge status={invitation.estatus} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {invitation.tipo_visita.replaceAll("_", " ")} · {formatDateTime(invitation.fecha_inicio)} -{" "}
                {formatDateTime(invitation.fecha_fin)}
              </p>
              {invitation.estatus === "VIGENTE" ? (
                <form action={adminCancelInvitationAction} className="mt-2">
                  <input type="hidden" name="id" value={invitation.id} />
                  <Button variant="secondary" size="sm">Cancelar invitacion</Button>
                </form>
              ) : null}
            </div>
          ))}
          {invitations.length === 0 ? <p className="text-sm text-muted-foreground">Sin invitaciones.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
