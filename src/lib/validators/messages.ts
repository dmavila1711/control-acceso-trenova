import { z } from "zod";

export const createMessageSchema = z
  .object({
    recipient_ids: z.array(z.string().uuid()).optional().default([]),
    // Envio rapido a un grupo del fraccionamiento (se expande server-side).
    group: z.preprocess(
      (value) => (value === "" || value === undefined ? undefined : value),
      z.enum(["TODOS", "COLONOS", "GUARDIAS"]).optional()
    ),
    titulo: z.string().trim().min(3, "Escribe el titulo."),
    mensaje: z.string().trim().min(5, "Escribe el mensaje.")
  })
  .superRefine((value, ctx) => {
    if (!value.group && value.recipient_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipient_ids"],
        message: "Selecciona destinatarios o un grupo."
      });
    }
  });

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
