import { z } from "zod";

export const createMessageSchema = z.object({
  recipient_ids: z.array(z.string().uuid()).min(1, "Selecciona al menos un destinatario."),
  titulo: z.string().trim().min(3, "Escribe el titulo."),
  mensaje: z.string().trim().min(5, "Escribe el mensaje.")
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
