import { z } from "zod";

const emptyStringToNull = (value: unknown) => (value === "" ? null : value);

export const createFractionationSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre."),
  direccion: z.preprocess(emptyStringToNull, z.string().trim().optional().nullable()),
  contacto_admin: z.preprocess(emptyStringToNull, z.string().trim().optional().nullable()),
  email_contacto: z.preprocess(emptyStringToNull, z.string().trim().email("Email invalido.").optional().nullable())
});

export const suspendFractionationSchema = z.object({
  id: z.string().uuid(),
  suspension_reason: z.string().trim().min(5, "Escribe el motivo de suspension.")
});

export const reactivateFractionationSchema = z.object({
  id: z.string().uuid()
});

export type CreateFractionationInput = z.infer<typeof createFractionationSchema>;
