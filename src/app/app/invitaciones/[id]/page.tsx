import { notFound } from "next/navigation";
import { QRDisplay } from "@/components/qr/qr-display";
import { ShareInvitation } from "@/components/qr/share-invitation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationStatusBadge } from "@/components/ui/status-badges";
import { cancelInvitationAction } from "@/server/actions/invitations.actions";
import { getInvitationDetail } from "@/lib/services/invitations.service";
import { formatDateTime } from "@/lib/utils";

export default async function InvitationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getInvitationDetail(id);

  if (!detail) {
    notFound();
  }

  const { invitation, qrPayload, numericCode } = detail;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>QR de acceso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrPayload ? <QRDisplay value={qrPayload} /> : <p className="text-sm text-muted-foreground">QR no disponible para esta invitacion.</p>}
          <div>
            <p className="text-sm text-muted-foreground">Codigo numerico</p>
            <p className="mt-1 text-4xl font-semibold tracking-normal">{numericCode ?? `****${invitation.codigo_numerico_last4 ?? ""}`}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de invitacion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{invitation.nombre_visitante}</h2>
            <InvitationStatusBadge status={invitation.estatus} />
          </div>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p><span className="text-muted-foreground">Tipo:</span> {invitation.tipo_visita.replaceAll("_", " ")}</p>
            <p><span className="text-muted-foreground">Autorizacion:</span> {invitation.tipo_autorizacion.replaceAll("_", " ")}</p>
            <p><span className="text-muted-foreground">Inicio:</span> {formatDateTime(invitation.fecha_inicio)}</p>
            <p><span className="text-muted-foreground">Fin:</span> {formatDateTime(invitation.fecha_fin)}</p>
            <p><span className="text-muted-foreground">Empresa:</span> {invitation.empresa ?? "No aplica"}</p>
            <p><span className="text-muted-foreground">Placas:</span> {invitation.placas ?? "No aplica"}</p>
          </div>
          {numericCode ? (
            <ShareInvitation
              fractionationName="Control de acceso"
              visitorName={invitation.nombre_visitante}
              numericCode={numericCode}
              expiresAt={invitation.fecha_fin}
              qrValue={qrPayload ?? undefined}
            />
          ) : null}
          {invitation.estatus === "VIGENTE" ? (
            <form action={cancelInvitationAction}>
              <input type="hidden" name="id" value={invitation.id} />
              <button className="rounded-md bg-destructive px-4 py-2 font-medium text-destructive-foreground" type="submit">
                Cancelar invitacion
              </button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
