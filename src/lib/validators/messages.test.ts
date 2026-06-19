import { describe, it, expect } from "vitest";
import { createMessageSchema } from "@/lib/validators/messages";

describe("createMessageSchema", () => {
  const base = { titulo: "Aviso", mensaje: "Mensaje de prueba" };
  const UUID = "20000000-0000-4000-8000-000000000001";

  it("acepta destinatarios individuales", () => {
    expect(createMessageSchema.safeParse({ ...base, recipient_ids: [UUID] }).success).toBe(true);
  });

  it("acepta un grupo sin destinatarios individuales", () => {
    expect(createMessageSchema.safeParse({ ...base, group: "TODOS" }).success).toBe(true);
  });

  it("trata el grupo vacio como seleccion individual", () => {
    const result = createMessageSchema.safeParse({ ...base, group: "", recipient_ids: [UUID] });
    expect(result.success).toBe(true);
  });

  it("rechaza cuando no hay ni grupo ni destinatarios", () => {
    const result = createMessageSchema.safeParse({ ...base });
    expect(result.success).toBe(false);
  });

  it("rechaza grupo vacio sin destinatarios", () => {
    const result = createMessageSchema.safeParse({ ...base, group: "", recipient_ids: [] });
    expect(result.success).toBe(false);
  });

  it("rechaza un grupo no permitido", () => {
    const result = createMessageSchema.safeParse({ ...base, group: "OTROS" });
    expect(result.success).toBe(false);
  });
});
