import { z } from "zod";
import { AUTHORIZATION_TYPES, VISIT_TYPES } from "@/types/domain";

export const createInvitationSchema = z
  .object({
    tipo_visita: z.enum(VISIT_TYPES, { required_error: "Selecciona el tipo de visita." }),
    nombre_visitante: z.string().trim().min(2, "Escribe el nombre del visitante."),
    empresa: z.string().trim().optional().nullable(),
    telefono_visitante: z.string().trim().optional().nullable(),
    placas: z.string().trim().optional().nullable(),
    tipo_autorizacion: z.enum(AUTHORIZATION_TYPES, {
      required_error: "Selecciona el tipo de autorizacion."
    }),
    fecha: z.string().optional(),
    fecha_fin: z.string().optional(),
    observaciones: z.string().trim().max(500, "Maximo 500 caracteres.").optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (value.tipo_autorizacion === "UN_DIA" && !value.fecha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fecha"],
        message: "Selecciona la fecha de la visita."
      });
    }

    if (value.tipo_autorizacion === "VISITA_FRECUENTE" && !value.fecha_fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fecha_fin"],
        message: "Selecciona la fecha final."
      });
    }
  });

export const cancelInvitationSchema = z.object({
  id: z.string().uuid("Invitacion invalida.")
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
