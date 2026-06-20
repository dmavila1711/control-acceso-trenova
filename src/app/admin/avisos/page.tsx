import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createNoticeAction,
  updateNoticeAction,
  updateNoticeStatusAction
} from "@/server/actions/admin.actions";
import { getAdminHouseholds, getAdminNotices } from "@/server/queries/admin";
import type { HouseholdRow, NoticeRow } from "@/types/database";
import { NOTICE_SEGMENTS } from "@/types/domain";
import { compactAddress, formatDateTime } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  TODOS: "Todos",
  COLONOS: "Colonos",
  GUARDIAS: "Guardias",
  ADMINISTRACION: "Administracion",
  CALLE: "Calle",
  DOMICILIO: "Domicilio"
};

function audienceLabel(notice: NoticeRow, households: HouseholdRow[]): string {
  if (notice.segmento === "CALLE") return `Calle ${notice.segmento_calle ?? ""}`.trim();
  if (notice.segmento === "DOMICILIO") {
    const household = households.find((item) => item.id === notice.segmento_domicilio_id);
    return household ? compactAddress(household) : "Domicilio";
  }
  return SEGMENT_LABELS[notice.segmento] ?? notice.segmento;
}

// Prefill para inputs datetime-local (recorta el ISO almacenado).
function toLocalInput(iso: string): string {
  return iso.slice(0, 16);
}

function NoticeFields({
  households,
  defaults
}: {
  households: HouseholdRow[];
  defaults?: NoticeRow;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`titulo-${defaults?.id ?? "new"}`}>Titulo</Label>
        <Input id={`titulo-${defaults?.id ?? "new"}`} name="titulo" defaultValue={defaults?.titulo} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`mensaje-${defaults?.id ?? "new"}`}>Mensaje</Label>
        <Textarea id={`mensaje-${defaults?.id ?? "new"}`} name="mensaje" defaultValue={defaults?.mensaje} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`prioridad-${defaults?.id ?? "new"}`}>Prioridad</Label>
          <Select id={`prioridad-${defaults?.id ?? "new"}`} name="prioridad" defaultValue={defaults?.prioridad ?? "NORMAL"}>
            <option value="BAJA">Baja</option>
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`segmento-${defaults?.id ?? "new"}`}>Dirigido a</Label>
          <Select id={`segmento-${defaults?.id ?? "new"}`} name="segmento" defaultValue={defaults?.segmento ?? "TODOS"}>
            {NOTICE_SEGMENTS.map((segment) => (
              <option key={segment} value={segment}>{SEGMENT_LABELS[segment]}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`calle-${defaults?.id ?? "new"}`}>Calle (solo para el segmento Calle)</Label>
        <Input id={`calle-${defaults?.id ?? "new"}`} name="segmento_calle" defaultValue={defaults?.segmento_calle ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`dom-${defaults?.id ?? "new"}`}>Domicilio (solo para el segmento Domicilio)</Label>
        <Select id={`dom-${defaults?.id ?? "new"}`} name="segmento_domicilio_id" defaultValue={defaults?.segmento_domicilio_id ?? ""}>
          <option value="">—</option>
          {households.map((household) => (
            <option key={household.id} value={household.id}>{compactAddress(household)}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`inicio-${defaults?.id ?? "new"}`}>Inicio</Label>
          <Input
            id={`inicio-${defaults?.id ?? "new"}`}
            name="fecha_inicio"
            type="datetime-local"
            defaultValue={defaults ? toLocalInput(defaults.fecha_inicio) : undefined}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`fin-${defaults?.id ?? "new"}`}>Fin</Label>
          <Input
            id={`fin-${defaults?.id ?? "new"}`}
            name="fecha_fin"
            type="datetime-local"
            defaultValue={defaults ? toLocalInput(defaults.fecha_fin) : undefined}
            required
          />
        </div>
      </div>
    </>
  );
}

export default async function AdminNoticesPage() {
  const [notices, households] = await Promise.all([getAdminNotices(), getAdminHouseholds()]);

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Crear aviso</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createNoticeAction} className="space-y-3">
            <NoticeFields households={households} />
            <Button className="w-full">Crear aviso</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{notice.titulo}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">Dirigido a: {audienceLabel(notice, households)}</Badge>
                  <Badge tone={notice.prioridad === "ALTA" ? "danger" : "warning"}>{notice.prioridad}</Badge>
                  <Badge tone={notice.estatus === "ACTIVO" ? "success" : "warning"}>{notice.estatus}</Badge>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{notice.mensaje}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(notice.fecha_inicio)} - {formatDateTime(notice.fecha_fin)}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <form action={updateNoticeStatusAction}>
                  <input type="hidden" name="id" value={notice.id} />
                  <input type="hidden" name="estatus" value={notice.estatus === "ACTIVO" ? "INACTIVO" : "ACTIVO"} />
                  <Button variant="secondary" size="sm">
                    {notice.estatus === "ACTIVO" ? "Inactivar" : "Activar"}
                  </Button>
                </form>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-primary">Editar</summary>
                <form action={updateNoticeAction} className="mt-2 space-y-3">
                  <input type="hidden" name="id" value={notice.id} />
                  <NoticeFields households={households} defaults={notice} />
                  <Button variant="secondary" size="sm">Guardar cambios</Button>
                </form>
              </details>
            </article>
          ))}
          {notices.length === 0 ? <p className="text-sm text-muted-foreground">Sin avisos.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
