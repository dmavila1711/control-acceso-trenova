import { z } from "zod";

export const createHouseholdSchema = z.object({
  calle: z.string().trim().min(2, "Escribe la calle."),
  numero_exterior: z.string().trim().min(1, "Escribe el numero exterior."),
  numero_interior: z.string().trim().optional().nullable(),
  referencia: z.string().trim().max(300, "Maximo 300 caracteres.").optional().nullable()
});

export const updateHouseholdStatusSchema = z.object({
  id: z.string().uuid(),
  estatus: z.enum(["ACTIVO", "INACTIVO"])
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
