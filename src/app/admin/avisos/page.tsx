import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createNoticeAction } from "@/server/actions/admin.actions";
import { getAdminNotices } from "@/server/queries/admin";
import { formatDateTime } from "@/lib/utils";

export default async function AdminNoticesPage() {
  const notices = await getAdminNotices();

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Crear aviso general</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createNoticeAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="titulo">Titulo</Label>
              <Input id="titulo" name="titulo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea id="mensaje" name="mensaje" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select id="prioridad" name="prioridad" defaultValue="NORMAL">
                <option value="BAJA">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Inicio</Label>
                <Input id="fecha_inicio" name="fecha_inicio" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fin</Label>
                <Input id="fecha_fin" name="fecha_fin" type="datetime-local" required />
              </div>
            </div>
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
                <Badge tone={notice.prioridad === "ALTA" ? "danger" : "warning"}>{notice.prioridad}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{notice.mensaje}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(notice.fecha_inicio)} - {formatDateTime(notice.fecha_fin)}
              </p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
