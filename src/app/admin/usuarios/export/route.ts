import { getAdminUsers } from "@/server/queries/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { errorMessage } from "@/lib/errors";
import type { UserProfileRow } from "@/types/database";

export async function GET() {
  try {
    const rows = await getAdminUsers();
    const csv = toCsv<UserProfileRow>(rows, [
      { key: "nombre", label: "Nombre" },
      { key: "email", label: "Email" },
      { key: "rol", label: "Rol" },
      { key: "estatus", label: "Estatus" },
      { key: "domicilio_id", label: "Domicilio ID" },
      { key: "created_at", label: "Alta" }
    ]);
    return csvResponse(csv, "usuarios.csv");
  } catch (error) {
    return new Response(errorMessage(error), { status: 403 });
  }
}
