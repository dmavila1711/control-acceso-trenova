import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getColonoDashboard } from "@/server/queries/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function ColonoMessagesPage() {
  const data = await getColonoDashboard();

  if (data.messages.length === 0) {
    return <EmptyState title="Sin mensajes" description="Administracion aun no te ha enviado mensajes internos." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensajes internos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.messages.map((message) => (
          <article key={message.id} className="rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{message.titulo}</h2>
              <p className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{message.mensaje}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
