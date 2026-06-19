import { getAdminInvitations } from "@/server/queries/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { errorMessage } from "@/lib/errors";
import type { InvitationRow } from "@/types/database";

export async function GET() {
  try {
    const rows = await getAdminInvitations();
    const csv = toCsv<InvitationRow>(rows, [
      { key: "created_at", label: "Creada" },
      { key: "nombre_visitante", label: "Visitante" },
      { key: "tipo_visita", label: "Tipo" },
      { key: "tipo_autorizacion", label: "Autorizacion" },
      { key: "estatus", label: "Estatus" },
      { key: "fecha_inicio", label: "Inicio" },
      { key: "fecha_fin", label: "Fin" },
      { key: "placas", label: "Placas" }
    ]);
    return csvResponse(csv, "invitaciones.csv");
  } catch (error) {
    return new Response(errorMessage(error), { status: 403 });
  }
}
