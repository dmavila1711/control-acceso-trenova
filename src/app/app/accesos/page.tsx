import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AccessStatusBadge } from "@/components/ui/status-badges";
import { getColonoDashboard } from "@/server/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function ColonoAccessLogsPage() {
  const data = await getColonoDashboard();

  if (data.accessLogs.length === 0) {
    return <EmptyState title="Sin accesos" description="Los accesos del domicilio apareceran aqui." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de accesos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.accessLogs.map((access) => (
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
      </CardContent>
    </Card>
  );
}
