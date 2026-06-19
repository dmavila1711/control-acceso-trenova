import { auditAction } from "@/lib/audit/audit";
import { AppError, ForbiddenError } from "@/lib/errors";
import type { Repositories } from "@/lib/repositories/contracts";
import { assertFractionationActive } from "@/lib/security/guards";
import { getServiceContext } from "@/lib/services/context";
import { toJson } from "@/lib/utils";
import {
  accessDecisionSchema,
  notFoundAccessSchema,
  validateNumericCodeSchema,
  validateQrSchema
} from "@/lib/validators/access";
import { hashNumericCode, hashQrToken, parseQrPayload } from "@/lib/qr/tokens";
import {
  SECURITY_EVENT,
  countRecentFailures,
  isRateLimited,
  logSecurityEvent
} from "@/lib/security/events";
import type { InvitationRow } from "@/types/database";
import type { AccessResult, InvitationValidationResult, ValidationMethod } from "@/types/domain";

const RATE_LIMITED_RESULT: InvitationValidationResult = {
  status: "INVALIDA",
  resultado: "OTRO",
  message: "Demasiados intentos. Espera un momento e intenta de nuevo."
};

async function evaluateInvitation(repositories: Repositories, invitation: InvitationRow | null): Promise<InvitationValidationResult> {
  if (!invitation) {
    return {
      status: "INVALIDA",
      resultado: "INVITACION_NO_ENCONTRADA",
      message: "No se encontro una invitacion vigente con ese dato."
    };
  }

  const [fractionation, household] = await Promise.all([
    repositories.fractionations.findById(invitation.fraccionamiento_id),
    repositories.households.findById(invitation.domicilio_id)
  ]);

  if (!fractionation) {
    return {
      status: "INVALIDA",
      resultado: "INVITACION_NO_ENCONTRADA",
      message: "No se encontro el fraccionamiento."
    };
  }

  if (fractionation.estatus !== "ACTIVO") {
    return {
      status: "INVALIDA",
      resultado: "FRACCIONAMIENTO_SUSPENDIDO",
      message: "El fraccionamiento esta suspendido."
    };
  }

  if (!household || household.estatus !== "ACTIVO") {
    return {
      status: "INVALIDA",
      resultado: "DOMICILIO_INACTIVO",
      message: "El domicilio esta inactivo."
    };
  }

  if (invitation.estatus === "CANCELADA") {
    return {
      status: "INVALIDA",
      resultado: "INVITACION_CANCELADA",
      message: "La invitacion fue cancelada."
    };
  }

  if (invitation.estatus !== "VIGENTE") {
    return {
      status: "INVALIDA",
      resultado: "OTRO",
      message: `La invitacion tiene estatus ${invitation.estatus}.`
    };
  }

  const now = Date.now();
  if (new Date(invitation.fecha_fin).getTime() < now || new Date(invitation.fecha_inicio).getTime() > now) {
    return {
      status: "INVALIDA",
      resultado: "INVITACION_EXPIRADA",
      message: "La invitacion no esta dentro de su vigencia."
    };
  }

  return {
    status: "VALIDA",
    invitacionId: invitation.id,
    domicilioId: invitation.domicilio_id,
    visitante: invitation.nombre_visitante,
    tipoVisita: invitation.tipo_visita,
    vigencia: {
      inicio: invitation.fecha_inicio,
      fin: invitation.fecha_fin
    }
  };
}

async function logInvalidAttempt(
  repositories: Repositories,
  actorId: string,
  fraccionamientoId: string,
  method: ValidationMethod,
  result: AccessResult,
  message: string
) {
  await repositories.accessLogs.create({
    fraccionamiento_id: fraccionamientoId,
    guardia_id: actorId,
    metodo_validacion: method,
    resultado: result,
    observaciones: message,
    resolved_at: new Date().toISOString()
  });
}

export async function validateQr(input: unknown) {
  const parsed = validateQrSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["GUARDIA", "ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const failures = await countRecentFailures({
    fraccionamientoId: actor.fraccionamiento_id,
    actorUserId: actor.id
  });
  if (isRateLimited(failures.guardia, failures.fraccionamiento)) {
    await logSecurityEvent({
      fraccionamientoId: actor.fraccionamiento_id,
      actorUserId: actor.id,
      actorRole: actor.rol,
      eventType: SECURITY_EVENT.RATE_LIMIT_QR,
      severity: "WARNING",
      metadata: toJson({ ...failures })
    });
    return RATE_LIMITED_RESULT;
  }

  const token = parseQrPayload(parsed.qrPayload);
  const invitation = token
    ? await repositories.invitations.findByQrHash(hashQrToken(token), actor.fraccionamiento_id)
    : null;
  const result = await evaluateInvitation(repositories, invitation);

  if (result.status === "INVALIDA") {
    await logInvalidAttempt(
      repositories,
      actor.id,
      actor.fraccionamiento_id,
      "QR",
      result.resultado,
      result.message
    );
    await logSecurityEvent({
      fraccionamientoId: actor.fraccionamiento_id,
      actorUserId: actor.id,
      actorRole: actor.rol,
      eventType: SECURITY_EVENT.INVALID_QR_ATTEMPT,
      severity: "INFO",
      entityType: "invitaciones",
      entityId: invitation?.id ?? null,
      metadata: toJson({ resultado: result.resultado })
    });
  }

  await auditAction({
    actor,
    action: "INVITACION_VALIDAR_QR",
    entityType: "invitaciones",
    entityId: invitation?.id ?? null,
    fraccionamientoId: actor.fraccionamiento_id,
    domicilioId: invitation?.domicilio_id ?? null,
    metadata: toJson({ resultado: result.status, metodo: "QR" })
  });

  return result;
}

export async function validateNumericCode(input: unknown) {
  const parsed = validateNumericCodeSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["GUARDIA", "ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const failures = await countRecentFailures({
    fraccionamientoId: actor.fraccionamiento_id,
    actorUserId: actor.id
  });
  if (isRateLimited(failures.guardia, failures.fraccionamiento)) {
    await logSecurityEvent({
      fraccionamientoId: actor.fraccionamiento_id,
      actorUserId: actor.id,
      actorRole: actor.rol,
      eventType: SECURITY_EVENT.RATE_LIMIT_CODE,
      severity: "WARNING",
      metadata: toJson({ ...failures })
    });
    return RATE_LIMITED_RESULT;
  }

  const invitation = await repositories.invitations.findByNumericHash(
    hashNumericCode(parsed.code),
    actor.fraccionamiento_id
  );
  const result = await evaluateInvitation(repositories, invitation);

  if (result.status === "INVALIDA") {
    await logInvalidAttempt(
      repositories,
      actor.id,
      actor.fraccionamiento_id,
      "CODIGO_NUMERICO",
      result.resultado,
      result.message
    );
    await logSecurityEvent({
      fraccionamientoId: actor.fraccionamiento_id,
      actorUserId: actor.id,
      actorRole: actor.rol,
      eventType: SECURITY_EVENT.INVALID_CODE_ATTEMPT,
      severity: "INFO",
      entityType: "invitaciones",
      entityId: invitation?.id ?? null,
      metadata: toJson({ resultado: result.resultado })
    });
  }

  await auditAction({
    actor,
    action: "INVITACION_VALIDAR_CODIGO",
    entityType: "invitaciones",
    entityId: invitation?.id ?? null,
    fraccionamientoId: actor.fraccionamiento_id,
    domicilioId: invitation?.domicilio_id ?? null,
    metadata: toJson({ resultado: result.status, metodo: "CODIGO_NUMERICO" })
  });

  return result;
}

export async function decideAccess(input: unknown) {
  const parsed = accessDecisionSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["GUARDIA", "ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const invitation = await repositories.invitations.findById(parsed.invitacion_id);
  if (!invitation) {
    throw new AppError("No se encontro la invitacion.");
  }

  if (invitation.fraccionamiento_id !== actor.fraccionamiento_id) {
    await logSecurityEvent({
      fraccionamientoId: actor.fraccionamiento_id,
      actorUserId: actor.id,
      actorRole: actor.rol,
      eventType: SECURITY_EVENT.CROSS_TENANT_ATTEMPT,
      severity: "CRITICAL",
      entityType: "invitaciones",
      entityId: invitation.id
    });
    throw new ForbiddenError();
  }

  const fractionation = await repositories.fractionations.findById(invitation.fraccionamiento_id);
  if (!fractionation) {
    throw new AppError("No se encontro el fraccionamiento.");
  }
  assertFractionationActive(fractionation.estatus);

  // Revalidamos en el momento de la decision: un PERMITIDO solo es valido si la
  // invitacion sigue vigente. Asi evitamos permitir invitaciones canceladas,
  // expiradas o ya usadas aunque se llame a la accion directamente.
  const resultado = parsed.resultado;
  const esUnSoloUso = invitation.tipo_autorizacion !== "VISITA_FRECUENTE";

  if (resultado === "PERMITIDO") {
    const evaluation = await evaluateInvitation(repositories, invitation);
    if (evaluation.status === "INVALIDA") {
      throw new AppError(evaluation.message);
    }

    // Para invitaciones de un solo uso, reclamamos de forma atomica: solo un
    // guardia puede marcarla USADA. Si otro la uso al mismo tiempo, bloqueamos.
    if (esUnSoloUso) {
      const claimed = await repositories.invitations.markUsedIfVigente(invitation.id);
      if (!claimed) {
        throw new AppError("La invitacion ya fue utilizada.");
      }
    }
  }

  const access = await repositories.accessLogs.create({
    fraccionamiento_id: invitation.fraccionamiento_id,
    domicilio_id: invitation.domicilio_id,
    invitacion_id: invitation.id,
    guardia_id: actor.id,
    nombre_visitante: invitation.nombre_visitante,
    tipo_visita: invitation.tipo_visita,
    metodo_validacion: parsed.metodo_validacion,
    resultado,
    observaciones: parsed.observaciones || null,
    resolved_at: new Date().toISOString()
  });

  if (resultado === "RECHAZADO") {
    await repositories.invitations.updateStatus(invitation.id, "RECHAZADA_EN_CASETA");
  }

  await auditAction({
    actor,
    action: resultado === "PERMITIDO" ? "ACCESO_PERMITIR" : "ACCESO_RECHAZAR",
    entityType: "accesos",
    entityId: access.id,
    fraccionamientoId: access.fraccionamiento_id,
    domicilioId: access.domicilio_id,
    metadata: toJson({
      invitacion_id: invitation.id,
      metodo_validacion: parsed.metodo_validacion,
      resultado
    })
  });

  return access;
}

export async function registerNotFoundAccess(input: unknown) {
  const parsed = notFoundAccessSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["GUARDIA", "ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const access = await repositories.accessLogs.create({
    fraccionamiento_id: actor.fraccionamiento_id,
    guardia_id: actor.id,
    nombre_visitante: parsed.nombre_visitante || null,
    metodo_validacion: "SIN_INVITACION",
    resultado: "INVITACION_NO_ENCONTRADA",
    observaciones: parsed.observaciones || null,
    resolved_at: new Date().toISOString()
  });

  await auditAction({
    actor,
    action: "ACCESO_INTENTO_NO_ENCONTRADO",
    entityType: "accesos",
    entityId: access.id,
    fraccionamientoId: access.fraccionamiento_id,
    metadata: toJson({ nombre_visitante: parsed.nombre_visitante ?? null })
  });

  return access;
}
