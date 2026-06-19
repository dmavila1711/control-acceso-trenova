import { describe, it, expect } from "vitest";
import { createUserWithAccountSchema } from "@/lib/validators/users";

describe("createUserWithAccountSchema", () => {
  const base = {
    nombre: "Juan Perez",
    email: "juan@correo.com",
    password: "clave1234",
    rol: "GUARDIA" as const
  };

  it("acepta un guardia sin domicilio", () => {
    expect(createUserWithAccountSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza un colono sin domicilio", () => {
    const result = createUserWithAccountSchema.safeParse({ ...base, rol: "COLONO" });
    expect(result.success).toBe(false);
  });

  it("acepta un colono con domicilio", () => {
    const result = createUserWithAccountSchema.safeParse({
      ...base,
      rol: "COLONO",
      domicilio_id: "20000000-0000-4000-8000-000000000001"
    });
    expect(result.success).toBe(true);
  });

  it("rechaza contrasena corta", () => {
    const result = createUserWithAccountSchema.safeParse({ ...base, password: "123" });
    expect(result.success).toBe(false);
  });

  it("rechaza email invalido", () => {
    const result = createUserWithAccountSchema.safeParse({ ...base, email: "no-es-email" });
    expect(result.success).toBe(false);
  });

  it("no permite el rol SUPERADMIN", () => {
    const result = createUserWithAccountSchema.safeParse({ ...base, rol: "SUPERADMIN" });
    expect(result.success).toBe(false);
  });
});
