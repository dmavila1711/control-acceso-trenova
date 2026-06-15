import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessDecisionPanel } from "@/features/access/access-decision-panel";
import { getInvitationDetail } from "@/lib/services/invitations.service";
import { formatDateTime } from "@/lib/utils";

export default async function CasetaInvitationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getInvitationDetail(id);

  if (!detail) {
    notFound();
  }

  const invitation = detail.invitation;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Detalle operativo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p><span className="text-muted-foreground">Visitante:</span> {invitation.nombre_visitante}</p>
          <p><span className="text-muted-foreground">Tipo:</span> {invitation.tipo_visita.replaceAll("_", " ")}</p>
          <p><span className="text-muted-foreground">Autorizacion:</span> {invitation.tipo_autorizacion.replaceAll("_", " ")}</p>
          <p><span className="text-muted-foreground">Estatus:</span> {invitation.estatus.replaceAll("_", " ")}</p>
          <p><span className="text-muted-foreground">Inicio:</span> {formatDateTime(invitation.fecha_inicio)}</p>
          <p><span className="text-muted-foreground">Fin:</span> {formatDateTime(invitation.fecha_fin)}</p>
        </CardContent>
      </Card>
      <AccessDecisionPanel
        method="BUSQUEDA_MANUAL"
        result={{
          status: "VALIDA",
          invitacionId: invitation.id,
          domicilioId: invitation.domicilio_id,
          visitante: invitation.nombre_visitante,
          tipoVisita: invitation.tipo_visita,
          vigencia: {
            inicio: invitation.fecha_inicio,
            fin: invitation.fecha_fin
          }
        }}
      />
    </div>
  );
}
