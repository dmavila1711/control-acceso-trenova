import { getAdminAudit } from "@/server/queries/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { errorMessage } from "@/lib/errors";
import type { AuditRow } from "@/types/database";

export async function GET() {
  try {
    const rows = await getAdminAudit();
    const csv = toCsv<AuditRow>(rows, [
      { key: "created_at", label: "Fecha" },
      { key: "actor_role", label: "Rol" },
      { key: "action", label: "Accion" },
      { key: "entity_type", label: "Entidad" },
      { key: "entity_id", label: "Entidad ID" }
    ]);
    return csvResponse(csv, "auditoria.csv");
  } catch (error) {
    return new Response(errorMessage(error), { status: 403 });
  }
}
