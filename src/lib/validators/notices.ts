import { z } from "zod";
import { NOTICE_PRIORITIES } from "@/types/domain";

export const createNoticeSchema = z
  .object({
    titulo: z.string().trim().min(3, "Escribe el titulo."),
    mensaje: z.string().trim().min(5, "Escribe el mensaje."),
    prioridad: z.enum(NOTICE_PRIORITIES).default("NORMAL"),
    fecha_inicio: z.string().min(1, "Selecciona fecha inicio."),
    fecha_fin: z.string().min(1, "Selecciona fecha fin.")
  })
  .refine((value) => new Date(value.fecha_fin) > new Date(value.fecha_inicio), {
    path: ["fecha_fin"],
    message: "La fecha fin debe ser mayor que la fecha inicio."
  });

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
