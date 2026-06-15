import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessStatusBadge } from "@/components/ui/status-badges";
import { getCasetaDashboard } from "@/server/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function CasetaAccessLogsPage() {
  const data = await getCasetaDashboard();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesos recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.recentAccessLogs.map((access) => (
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
        {data.recentAccessLogs.length === 0 ? <p className="text-sm text-muted-foreground">Aun no hay accesos.</p> : null}
      </CardContent>
    </Card>
  );
}
