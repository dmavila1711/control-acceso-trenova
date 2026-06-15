import { z } from "zod";
import { ACCESS_RESULTS, VALIDATION_METHODS } from "@/types/domain";

export const validateQrSchema = z.object({
  qrPayload: z.string().trim().min(12, "QR invalido.")
});

export const validateNumericCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "El codigo debe tener 6 digitos.")
});

export const accessDecisionSchema = z.object({
  invitacion_id: z.string().uuid(),
  metodo_validacion: z.enum(VALIDATION_METHODS),
  resultado: z.enum(ACCESS_RESULTS),
  observaciones: z.string().trim().max(500).optional().nullable()
});

export const notFoundAccessSchema = z.object({
  nombre_visitante: z.string().trim().optional().nullable(),
  observaciones: z.string().trim().max(500).optional().nullable()
});
