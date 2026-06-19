import { getAdminAccessLogs } from "@/server/queries/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { errorMessage } from "@/lib/errors";
import type { AccessLogRow } from "@/types/database";

export async function GET() {
  try {
    const rows = await getAdminAccessLogs();
    const csv = toCsv<AccessLogRow>(rows, [
      { key: "arrived_at", label: "Fecha" },
      { key: "nombre_visitante", label: "Visitante" },
      { key: "tipo_visita", label: "Tipo" },
      { key: "metodo_validacion", label: "Metodo" },
      { key: "resultado", label: "Resultado" },
      { key: "observaciones", label: "Observaciones" }
    ]);
    return csvResponse(csv, "accesos.csv");
  } catch (error) {
    return new Response(errorMessage(error), { status: 403 });
  }
}
