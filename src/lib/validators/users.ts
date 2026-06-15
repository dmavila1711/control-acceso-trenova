import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "@/types/domain";

const optionalUuid = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().uuid().nullable().optional()
);

export const createUserSchema = z
  .object({
    auth_user_id: z.string().uuid("El ID de Auth debe ser UUID."),
    nombre: z.string().trim().min(2, "Escribe el nombre."),
    email: z.string().trim().email("Escribe un email valido."),
    rol: z.enum(USER_ROLES),
    fraccionamiento_id: optionalUuid,
    domicilio_id: optionalUuid,
    estatus: z.enum(USER_STATUSES).default("ACTIVO")
  })
  .superRefine((value, ctx) => {
    if (value.rol === "COLONO" && !value.domicilio_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["domicilio_id"],
        message: "El colono requiere domicilio."
      });
    }

    if (value.rol !== "SUPERADMIN" && !value.fraccionamiento_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fraccionamiento_id"],
        message: "El usuario requiere fraccionamiento."
      });
    }
  });

export const updateUserStatusSchema = z.object({
  id: z.string().uuid(),
  estatus: z.enum(["ACTIVO", "INACTIVO"])
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
