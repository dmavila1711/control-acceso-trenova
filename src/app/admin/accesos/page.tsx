import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AccessStatusBadge } from "@/components/ui/status-badges";
import { getAdminAccessLogs, getAdminHouseholds, getAdminUsers } from "@/server/queries/admin";
import { ACCESS_RESULTS, VALIDATION_METHODS } from "@/types/domain";
import { compactAddress, formatDateTime } from "@/lib/utils";

export default async function AdminAccessLogsPage({
  searchParams
}: {
  searchParams: Promise<{
    resultado?: string;
    metodo?: string;
    domicilio?: string;
    guardia?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const params = await searchParams;
  const [accessLogs, households, users] = await Promise.all([
    getAdminAccessLogs({
      resultado: params.resultado,
      metodo: params.metodo,
      domicilioId: params.domicilio,
      guardiaId: params.guardia,
      desde: params.desde,
      hasta: params.hasta
    }),
    getAdminHouseholds(),
    getAdminUsers()
  ]);
  const guardias = users.filter((user) => user.rol === "GUARDIA");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Accesos</CardTitle>
        <a
          href="/admin/accesos/export"
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
        >
          Exportar CSV
        </a>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="resultado" className="text-xs text-muted-foreground">Resultado</label>
            <Select id="resultado" name="resultado" defaultValue={params.resultado ?? ""}>
              <option value="">Todos</option>
              {ACCESS_RESULTS.map((r) => (
                <option key={r} value={r}>{r.replaceAll("_", " ")}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="metodo" className="text-xs text-muted-foreground">Metodo</label>
            <Select id="metodo" name="metodo" defaultValue={params.metodo ?? ""}>
              <option value="">Todos</option>
              {VALIDATION_METHODS.map((mtd) => (
                <option key={mtd} value={mtd}>{mtd.replaceAll("_", " ")}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="domicilio" className="text-xs text-muted-foreground">Domicilio</label>
            <Select id="domicilio" name="domicilio" defaultValue={params.domicilio ?? ""}>
              <option value="">Todos</option>
              {households.map((household) => (
                <option key={household.id} value={household.id}>{compactAddress(household)}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="guardia" className="text-xs text-muted-foreground">Guardia</label>
            <Select id="guardia" name="guardia" defaultValue={params.guardia ?? ""}>
              <option value="">Todos</option>
              {guardias.map((guardia) => (
                <option key={guardia.id} value={guardia.id}>{guardia.nombre}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="desde" className="text-xs text-muted-foreground">Desde</label>
            <Input id="desde" name="desde" type="date" defaultValue={params.desde ?? ""} />
          </div>
          <div className="space-y-1">
            <label htmlFor="hasta" className="text-xs text-muted-foreground">Hasta</label>
            <Input id="hasta" name="hasta" type="date" defaultValue={params.hasta ?? ""} />
          </div>
          <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
        </form>

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
