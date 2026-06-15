import { describe, it, expect } from "vitest";
import {
  resolveTimeZone,
  zonedDayBounds,
  zonedEndOfDay,
  zonedEndOfDayPlusDays,
  zonedStartOfDay,
  zonedStartOfMonth
} from "@/lib/time/zoned";

// America/Mexico_City es UTC-6 (sin horario de verano desde 2023).
const TZ = "America/Mexico_City";
const ref = new Date("2026-06-13T20:00:00.000Z"); // 14:00 hora local

describe("zoned (limites de dia/mes por zona horaria)", () => {
  it("calcula el inicio del dia local como 06:00Z", () => {
    expect(zonedStartOfDay(TZ, ref).toISOString()).toBe("2026-06-13T06:00:00.000Z");
  });

  it("calcula el fin del dia local sin desbordar milisegundos", () => {
    expect(zonedEndOfDay(TZ, ref).toISOString()).toBe("2026-06-14T05:59:59.999Z");
  });

  it("calcula el inicio del mes local", () => {
    expect(zonedStartOfMonth(TZ, ref).toISOString()).toBe("2026-06-01T06:00:00.000Z");
  });

  it("interpreta una fecha YYYY-MM-DD en la zona local", () => {
    const { start, end } = zonedDayBounds("2026-12-25", TZ);
    expect(start.toISOString()).toBe("2026-12-25T06:00:00.000Z");
    expect(end.toISOString()).toBe("2026-12-26T05:59:59.999Z");
  });

  it("suma dias para HOY_MANANA", () => {
    expect(zonedEndOfDayPlusDays(TZ, 1, ref).toISOString()).toBe("2026-06-15T05:59:59.999Z");
  });

  it("usa el default America/Mexico_City ante una zona invalida", () => {
    expect(resolveTimeZone("Zona/Inexistente")).toBe("America/Mexico_City");
  });
});
