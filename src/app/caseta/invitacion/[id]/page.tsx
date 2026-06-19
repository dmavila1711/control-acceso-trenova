import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessDecisionPanel } from "@/features/access/access-decision-panel";
import { getInvitationDetail } from "@/lib/services/invitations.service";
import { formatDateTime } from "@/lib/utils";
import type { InvitationValidationResult } from "@/types/domain";

export default async function CasetaInvitationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getInvitationDetail(id);

  if (!detail) {
    notFound();
  }

  const invitation = detail.invitation;

  // Validez real al momento (no se asume VALIDA): el guardia debe ver el estado
  // verdadero. El servidor revalida de nuevo al decidir.
  const now = Date.now();
  const dentroDeVigencia =
    new Date(invitation.fecha_inicio).getTime() <= now && new Date(invitation.fecha_fin).getTime() >= now;

  let result: InvitationValidationResult;
  if (invitation.estatus === "VIGENTE" && dentroDeVigencia) {
    result = {
      status: "VALIDA",
      invitacionId: invitation.id,
      domicilioId: invitation.domicilio_id,
      visitante: invitation.nombre_visitante,
      tipoVisita: invitation.tipo_visita,
      placas: invitation.placas,
      vigencia: { inicio: invitation.fecha_inicio, fin: invitation.fecha_fin }
    };
  } else if (invitation.estatus === "CANCELADA") {
    result = { status: "INVALIDA", resultado: "INVITACION_CANCELADA", message: "La invitacion fue cancelada." };
  } else if (invitation.estatus === "USADA") {
    result = { status: "INVALIDA", resultado: "OTRO", message: "La invitacion ya fue utilizada." };
  } else if (!dentroDeVigencia) {
    result = {
      status: "INVALIDA",
      resultado: "INVITACION_EXPIRADA",
      message: "La invitacion no esta dentro de su vigencia."
    };
  } else {
    result = {
      status: "INVALIDA",
      resultado: "OTRO",
      message: `La invitacion tiene estatus ${invitation.estatus.replaceAll("_", " ")}.`
    };
  }

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
          {invitation.placas ? <p><span className="text-muted-foreground">Placas:</span> {invitation.placas}</p> : null}
          <p><span className="text-muted-foreground">Inicio:</span> {formatDateTime(invitation.fecha_inicio)}</p>
          <p><span className="text-muted-foreground">Fin:</span> {formatDateTime(invitation.fecha_fin)}</p>
        </CardContent>
      </Card>
      <AccessDecisionPanel method="BUSQUEDA_MANUAL" result={result} />
    </div>
  );
}
