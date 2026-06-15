import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminAudit } from "@/server/queries/admin";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAuditPage() {
  const rows = await getAdminAudit();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoria del fraccionamiento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-md border p-3">
            <p className="font-medium">{row.action}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.entity_type} · {formatDateTime(row.created_at)} · {row.actor_role ?? "Sistema"}
            </p>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin eventos de auditoria.</p> : null}
      </CardContent>
    </Card>
  );
}
