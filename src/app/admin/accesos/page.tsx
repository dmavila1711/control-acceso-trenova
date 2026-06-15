import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessStatusBadge } from "@/components/ui/status-badges";
import { getAdminAccessLogs } from "@/server/queries/admin";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAccessLogsPage() {
  const accessLogs = await getAdminAccessLogs();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accessLogs.map((access) => (
          <div key={access.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{access.nombre_visitante ?? "Sin visitante"}</p>
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
  );
}
