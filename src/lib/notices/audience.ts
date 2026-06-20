import type { NoticeAudience } from "@/lib/repositories/contracts";
import type { NoticeRow } from "@/types/database";

// Determina si un aviso segmentado es visible para una audiencia (rol/calle/domicilio).
// Funcion pura: la usan el repositorio (server-side) y las pruebas.
export function noticeMatchesAudience(
  notice: Pick<NoticeRow, "segmento" | "segmento_calle" | "segmento_domicilio_id">,
  audience: NoticeAudience
): boolean {
  switch (notice.segmento) {
    case "TODOS":
      return true;
    case "COLONOS":
      return audience.rol === "COLONO";
    case "GUARDIAS":
      return audience.rol === "GUARDIA";
    case "ADMINISTRACION":
      return audience.rol === "ADMINISTRACION";
    case "CALLE":
      return Boolean(audience.calle) && notice.segmento_calle === audience.calle;
    case "DOMICILIO":
      return Boolean(audience.domicilioId) && notice.segmento_domicilio_id === audience.domicilioId;
    default:
      return false;
  }
}
