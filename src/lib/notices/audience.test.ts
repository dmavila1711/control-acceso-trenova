import { describe, it, expect } from "vitest";
import { noticeMatchesAudience } from "@/lib/notices/audience";

function notice(segmento: string, calle: string | null = null, domicilioId: string | null = null) {
  return {
    segmento: segmento as never,
    segmento_calle: calle,
    segmento_domicilio_id: domicilioId
  };
}

describe("noticeMatchesAudience", () => {
  it("TODOS es visible para cualquier rol", () => {
    expect(noticeMatchesAudience(notice("TODOS"), { rol: "COLONO" })).toBe(true);
    expect(noticeMatchesAudience(notice("TODOS"), { rol: "GUARDIA" })).toBe(true);
    expect(noticeMatchesAudience(notice("TODOS"), { rol: "ADMINISTRACION" })).toBe(true);
  });

  it("COLONOS solo es visible para colonos", () => {
    expect(noticeMatchesAudience(notice("COLONOS"), { rol: "COLONO" })).toBe(true);
    expect(noticeMatchesAudience(notice("COLONOS"), { rol: "GUARDIA" })).toBe(false);
  });

  it("GUARDIAS solo es visible para guardias", () => {
    expect(noticeMatchesAudience(notice("GUARDIAS"), { rol: "GUARDIA" })).toBe(true);
    expect(noticeMatchesAudience(notice("GUARDIAS"), { rol: "COLONO" })).toBe(false);
  });

  it("ADMINISTRACION solo es visible para administracion", () => {
    expect(noticeMatchesAudience(notice("ADMINISTRACION"), { rol: "ADMINISTRACION" })).toBe(true);
    expect(noticeMatchesAudience(notice("ADMINISTRACION"), { rol: "COLONO" })).toBe(false);
  });

  it("CALLE solo coincide con la misma calle del colono", () => {
    const aviso = notice("CALLE", "Principal");
    expect(noticeMatchesAudience(aviso, { rol: "COLONO", calle: "Principal" })).toBe(true);
    expect(noticeMatchesAudience(aviso, { rol: "COLONO", calle: "Secundaria" })).toBe(false);
    expect(noticeMatchesAudience(aviso, { rol: "COLONO", calle: null })).toBe(false);
  });

  it("DOMICILIO solo coincide con el domicilio del colono", () => {
    const aviso = notice("DOMICILIO", null, "dom-1");
    expect(noticeMatchesAudience(aviso, { rol: "COLONO", domicilioId: "dom-1" })).toBe(true);
    expect(noticeMatchesAudience(aviso, { rol: "COLONO", domicilioId: "dom-2" })).toBe(false);
    expect(noticeMatchesAudience(aviso, { rol: "COLONO", domicilioId: null })).toBe(false);
  });
});
