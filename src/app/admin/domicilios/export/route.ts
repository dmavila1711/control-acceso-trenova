import { getAdminHouseholds } from "@/server/queries/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { errorMessage } from "@/lib/errors";
import type { HouseholdRow } from "@/types/database";

export async function GET() {
  try {
    const rows = await getAdminHouseholds();
    const csv = toCsv<HouseholdRow>(rows, [
      { key: "calle", label: "Calle" },
      { key: "numero_exterior", label: "Numero exterior" },
      { key: "numero_interior", label: "Numero interior" },
      { key: "referencia", label: "Referencia" },
      { key: "estatus", label: "Estatus" }
    ]);
    return csvResponse(csv, "domicilios.csv");
  } catch (error) {
    return new Response(errorMessage(error), { status: 403 });
  }
}
