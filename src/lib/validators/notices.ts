import { z, ZodIssueCode } from "zod";
import { NOTICE_PRIORITIES, NOTICE_SEGMENTS, NOTICE_STATUSES } from "@/types/domain";

const optionalText = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.string().trim().optional()
);

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.string().uuid("Domicilio invalido.").optional()
);

const noticeFields = {
  titulo: z.string().trim().min(3, "Escribe el titulo."),
  mensaje: z.string().trim().min(5, "Escribe el mensaje."),
  prioridad: z.enum(NOTICE_PRIORITIES).default("NORMAL"),
  segmento: z.enum(NOTICE_SEGMENTS).default("TODOS"),
  segmento_calle: optionalText,
  segmento_domicilio_id: optionalUuid,
  fecha_inicio: z.string().min(1, "Selecciona fecha inicio."),
  fecha_fin: z.string().min(1, "Selecciona fecha fin.")
};

type NoticeShape = {
  segmento: (typeof NOTICE_SEGMENTS)[number];
  segmento_calle?: string;
  segmento_domicilio_id?: string;
  fecha_inicio: string;
  fecha_fin: string;
};

function refineNotice(value: NoticeShape, ctx: z.RefinementCtx) {
  if (new Date(value.fecha_fin) <= new Date(value.fecha_inicio)) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      path: ["fecha_fin"],
      message: "La fecha fin debe ser mayor que la fecha inicio."
    });
  }
  if (value.segmento === "CALLE" && !value.segmento_calle) {
    ctx.addIssue({ code: ZodIssueCode.custom, path: ["segmento_calle"], message: "Indica la calle." });
  }
  if (value.segmento === "DOMICILIO" && !value.segmento_domicilio_id) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      path: ["segmento_domicilio_id"],
      message: "Selecciona el domicilio."
    });
  }
}

export const createNoticeSchema = z.object(noticeFields).superRefine(refineNotice);

export const updateNoticeSchema = z
  .object({ id: z.string().uuid("Aviso invalido."), ...noticeFields })
  .superRefine(refineNotice);

export const updateNoticeStatusSchema = z.object({
  id: z.string().uuid("Aviso invalido."),
  estatus: z.enum(NOTICE_STATUSES)
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
