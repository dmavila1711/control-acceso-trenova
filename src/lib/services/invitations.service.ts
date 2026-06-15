import { auditAction } from "@/lib/audit/audit";
import { AppError, ForbiddenError } from "@/lib/errors";
import { createRepositories } from "@/lib/repositories/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertFractionationActive } from "@/lib/security/guards";
import { getServiceContext } from "@/lib/services/context";
import { toJson } from "@/lib/utils";
import { createInvitationSchema } from "@/lib/validators/invitations";
import {
  resolveTimeZone,
  zonedDayBounds,
  zonedEndOfDay,
  zonedEndOfDayPlusDays
} from "@/lib/time/zoned";
import {
  decryptNumericCode,
  decryptQrToken,
  generateNumericCode,
  generateQrToken,
  encryptNumericCode,
  encryptQrToken,
  hashNumericCode,
  hashQrToken,
  last4,
  toQrPayload
} from "@/lib/qr/tokens";
import type { CreateInvitationInput } from "@/lib/validators/invitations";

function invitationRange(input: CreateInvitationInput, timeZone: string) {
  const now = new Date();

  if (input.tipo_autorizacion === "UN_DIA") {
    const { start, end } = zonedDayBounds(input.fecha ?? "", timeZone);
    return {
      fecha_inicio: start.toISOString(),
      fecha_fin: end.toISOString()
    };
  }

  if (input.tipo_autorizacion === "HOY_MANANA") {
    return {
      fecha_inicio: now.toISOString(),
      fecha_fin: zonedEndOfDayPlusDays(timeZone, 1).toISOString()
    };
  }

  if (input.tipo_autorizacion === "VISITA_FRECUENTE") {
    const maxEnd = zonedEndOfDayPlusDays(timeZone, 90);
    const selected = zonedDayBounds(input.fecha_fin ?? "", timeZone).end;

    if (selected.getTime() > maxEnd.getTime()) {
      throw new AppError("La visita frecuente no puede exceder 90 dias en esta fase.");
    }

    return {
      fecha_inicio: now.toISOString(),
      fecha_fin: selected.toISOString()
    };
  }

  return {
    fecha_inicio: now.toISOString(),
    fecha_fin: zonedEndOfDay(timeZone).toISOString()
  };
}

export async function createInvitation(input: unknown) {
  const parsed = createInvitationSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["COLONO", "ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  if (!actor.domicilio_id && actor.rol === "COLONO") {
    throw new ForbiddenError("Tu usuario no tiene domicilio asignado.");
  }

  const domicilioId = actor.domicilio_id;
  if (!domicilioId) {
    throw new ForbiddenError("Seleccion de domicilio administrativa pendiente para esta version.");
  }

  const [fractionation, household, config] = await Promise.all([
    repositories.fractionations.findById(actor.fraccionamiento_id),
    repositories.households.findById(domicilioId),
    repositories.fractionations.getConfig(actor.fraccionamiento_id)
  ]);

  if (!fractionation) {
    throw new AppError("No se encontro el fraccionamiento.");
  }

  if (!household || household.estatus !== "ACTIVO") {
    throw new ForbiddenError("El domicilio esta inactivo.");
  }

  assertFractionationActive(fractionation.estatus);

  const timeZone = resolveTimeZone(config?.zona_horaria);
  const qrToken = generateQrToken();
  const numericCode = generateNumericCode();
  const range = invitationRange(parsed, timeZone);

  const invitation = await repositories.invitations.create({
    fraccionamiento_id: actor.fraccionamiento_id,
    domicilio_id: domicilioId,
    created_by: actor.id,
    tipo_visita: parsed.tipo_visita,
    nombre_visitante: parsed.nombre_visitante,
    empresa: parsed.empresa || null,
    telefono_visitante: parsed.telefono_visitante || null,
    placas: parsed.placas || null,
    tipo_autorizacion: parsed.tipo_autorizacion,
    fecha_inicio: range.fecha_inicio,
    fecha_fin: range.fecha_fin,
    qr_token_hash: hashQrToken(qrToken),
    codigo_numerico_hash: hashNumericCode(numericCode),
    qr_token_ciphertext: encryptQrToken(qrToken),
    codigo_numerico_ciphertext: encryptNumericCode(numericCode),
    codigo_numerico_last4: last4(numericCode),
    observaciones: parsed.observaciones || null
  });

  await auditAction({
    actor,
    action: "INVITACION_CREAR",
    entityType: "invitaciones",
    entityId: invitation.id,
    fraccionamientoId: invitation.fraccionamiento_id,
    domicilioId: invitation.domicilio_id,
    newValues: toJson({
      id: invitation.id,
      tipo_visita: invitation.tipo_visita,
      tipo_autorizacion: invitation.tipo_autorizacion,
      fecha_inicio: invitation.fecha_inicio,
      fecha_fin: invitation.fecha_fin,
      codigo_numerico_last4: invitation.codigo_numerico_last4
    })
  });

  return {
    invitation,
    qrPayload: toQrPayload(qrToken),
    numericCode,
    fractionationName: fractionation.nombre
  };
}

export async function cancelInvitation(id: string) {
  const { actor, repositories } = await getServiceContext(["COLONO", "ADMINISTRACION"]);
  const current = await repositories.invitations.findById(id);

  if (!current) {
    throw new AppError("No se encontro la invitacion.");
  }

  if (actor.rol === "COLONO" && current.domicilio_id !== actor.domicilio_id) {
    throw new ForbiddenError();
  }

  if (actor.rol === "ADMINISTRACION" && current.fraccionamiento_id !== actor.fraccionamiento_id) {
    throw new ForbiddenError();
  }

  if (current.estatus !== "VIGENTE") {
    throw new AppError("Solo se pueden cancelar invitaciones vigentes.");
  }

  const updated = await repositories.invitations.cancel(id, actor.id);

  await auditAction({
    actor,
    action: "INVITACION_CANCELAR",
    entityType: "invitaciones",
    entityId: id,
    fraccionamientoId: updated.fraccionamiento_id,
    domicilioId: updated.domicilio_id,
    previousValues: toJson({ estatus: current.estatus }),
    newValues: toJson({ estatus: updated.estatus })
  });

  return updated;
}

export async function getInvitationDetail(id: string) {
  const actor = await getServiceContext(["COLONO", "ADMINISTRACION", "GUARDIA", "SUPERADMIN"]).then(
    (context) => context.actor
  );
  const supabase = await createSupabaseServerClient();
  const repositories = createRepositories(supabase);
  const invitation = await repositories.invitations.findById(id);

  if (!invitation) {
    return null;
  }

  if (actor.rol === "COLONO" && invitation.domicilio_id !== actor.domicilio_id) {
    throw new ForbiddenError();
  }

  if (
    (actor.rol === "ADMINISTRACION" || actor.rol === "GUARDIA") &&
    invitation.fraccionamiento_id !== actor.fraccionamiento_id
  ) {
    throw new ForbiddenError();
  }

  const qrToken = decryptQrToken(invitation.qr_token_ciphertext);
  const numericCode = decryptNumericCode(invitation.codigo_numerico_ciphertext);

  return {
    invitation,
    qrPayload: qrToken ? toQrPayload(qrToken) : null,
    numericCode
  };
}
