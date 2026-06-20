import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccessStatusBadge, InvitationStatusBadge } from "@/components/ui/status-badges";
import { updateHouseholdStatusAction } from "@/server/actions/admin.actions";
import { getAdminHouseholdDetail } from "@/server/queries/admin";
import { compactAddress, formatDateTime } from "@/lib/utils";

export default async function AdminHouseholdDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAdminHouseholdDetail(id);
  if (!detail) {
    notFound();
  }

  const { household, colonos, invitations, accessLogs, counts } = detail;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/domicilios" className="text-sm text-primary hover:underline">
            ← Volver a domicilios
          </Link>
          <h1 className="text-xl font-semibold">{compactAddress(household)}</h1>
          <p className="text-sm text-muted-foreground">{household.estatus.replaceAll("_", " ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {household.estatus !== "ACTIVO" ? (
            <form action={updateHouseholdStatusAction}>
              <input type="hidden" name="id" value={household.id} />
              <input type="hidden" name="estatus" value="ACTIVO" />
              <Button variant="secondary" size="sm">Activar</Button>
            </form>
          ) : null}
          {household.estatus !== "BLOQUEADO_PARA_INVITACIONES" ? (
            <form action={updateHouseholdStatusAction}>
              <input type="hidden" name="id" value={household.id} />
              <input type="hidden" name="estatus" value="BLOQUEADO_PARA_INVITACIONES" />
              <Button variant="secondary" size="sm">Bloquear invitaciones</Button>
            </form>
          ) : null}
          {household.estatus !== "INACTIVO" ? (
            <form action={updateHouseholdStatusAction}>
              <input type="hidden" name="id" value={household.id} />
              <input type="hidden" name="estatus" value="INACTIVO" />
              <Button variant="secondary" size="sm">Inactivar</Button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del domicilio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="Calle" value={household.calle} />
            <Field label="Numero exterior" value={household.numero_exterior} />
            <Field label="Numero interior" value={household.numero_interior ?? "—"} />
            <Field label="Referencia" value={household.referencia ?? "—"} />
            <Field label="Estatus" value={household.estatus.replaceAll("_", " ")} />
            <Field label="Alta" value={formatDateTime(household.created_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colonos asociados ({counts.colonos})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {colonos.map((colono) => (
              <div key={colono.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{colono.nombre}</p>
                  <p className="truncate text-sm text-muted-foreground">{colono.email} · {colono.rol}</p>
                </div>
                <Badge tone={colono.estatus === "ACTIVO" ? "success" : "warning"}>{colono.estatus}</Badge>
              </div>
            ))}
            {colonos.length === 0 ? <p className="text-sm text-muted-foreground">Sin colonos asociados.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitaciones recientes ({counts.invitaciones})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
            </div>
          ))}
          {invitations.length === 0 ? <p className="text-sm text-muted-foreground">Sin invitaciones.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accesos recientes ({counts.accesos})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {accessLogs.map((access) => (
            <div key={access.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{access.nombre_visitante ?? "Visitante sin nombre"}</p>
                <AccessStatusBadge result={access.resultado} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {access.metodo_validacion.replaceAll("_", " ")} · {formatDateTime(access.arrived_at)}
              </p>
            </div>
          ))}
          {accessLogs.length === 0 ? <p className="text-sm text-muted-foreground">Sin accesos.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
