import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendInternalMessageAction } from "@/server/actions/admin.actions";
import { getAdminMessages, getAdminUsers } from "@/server/queries/admin";
import { formatDateTime } from "@/lib/utils";

export default async function AdminMessagesPage() {
  const [messages, users] = await Promise.all([getAdminMessages(), getAdminUsers()]);
  const recipients = users.filter((user) => user.estatus === "ACTIVO");

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Enviar mensaje interno</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={sendInternalMessageAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="titulo">Titulo</Label>
              <Input id="titulo" name="titulo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea id="mensaje" name="mensaje" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Enviar a un grupo (opcional)</Label>
              <Select id="group" name="group" defaultValue="">
                <option value="">Destinatarios especificos</option>
                <option value="TODOS">Todos (colonos y guardias)</option>
                <option value="COLONOS">Todos los colonos</option>
                <option value="GUARDIAS">Todos los guardias</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si eliges un grupo, se ignora la seleccion individual de abajo.
              </p>
            </div>
            <div className="max-h-56 space-y-2 overflow-auto rounded-md border p-3">
              {recipients.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="recipient_ids" value={user.id} className="h-4 w-4" />
                  <span>{user.nombre} · {user.rol}</span>
                </label>
              ))}
            </div>
            <Button className="w-full">Enviar mensaje</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de mensajes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-md border p-3">
              <p className="font-medium">{message.titulo}</p>
              <p className="mt-1 text-sm text-muted-foreground">{message.mensaje}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(message.created_at)} · {message.estatus}</p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
