import { auditAction } from "@/lib/audit/audit";
import { AppError, ForbiddenError } from "@/lib/errors";
import { getServiceContext } from "@/lib/services/context";
import { toJson } from "@/lib/utils";
import { createHouseholdSchema, updateHouseholdStatusSchema } from "@/lib/validators/households";
import { createMessageSchema } from "@/lib/validators/messages";
import { createNoticeSchema } from "@/lib/validators/notices";
import { createUserSchema, updateUserStatusSchema } from "@/lib/validators/users";

export async function createHousehold(input: unknown) {
  const parsed = createHouseholdSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const household = await repositories.households.create({
    fraccionamiento_id: actor.fraccionamiento_id,
    calle: parsed.calle,
    numero_exterior: parsed.numero_exterior,
    numero_interior: parsed.numero_interior || null,
    referencia: parsed.referencia || null
  });

  await auditAction({
    actor,
    action: "DOMICILIO_CREAR",
    entityType: "domicilios",
    entityId: household.id,
    fraccionamientoId: household.fraccionamiento_id,
    domicilioId: household.id,
    newValues: toJson(household)
  });

  return household;
}

export async function updateHouseholdStatus(input: unknown) {
  const parsed = updateHouseholdStatusSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);
  const current = await repositories.households.findById(parsed.id);

  if (!current || current.fraccionamiento_id !== actor.fraccionamiento_id) {
    throw new ForbiddenError();
  }

  const updated = await repositories.households.updateStatus(parsed.id, parsed.estatus);

  await auditAction({
    actor,
    action: "DOMICILIO_CAMBIAR_ESTATUS",
    entityType: "domicilios",
    entityId: updated.id,
    fraccionamientoId: updated.fraccionamiento_id,
    domicilioId: updated.id,
    previousValues: toJson({ estatus: current.estatus }),
    newValues: toJson({ estatus: updated.estatus })
  });

  return updated;
}

export async function createUser(input: unknown) {
  const parsed = createUserSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  if (parsed.rol === "SUPERADMIN") {
    throw new ForbiddenError("Administracion no puede crear superadmins.");
  }

  if (parsed.fraccionamiento_id !== actor.fraccionamiento_id) {
    throw new ForbiddenError("No puedes crear usuarios en otro fraccionamiento.");
  }

  if (parsed.rol === "COLONO" && parsed.domicilio_id) {
    const activeColonists = await repositories.users.countActiveColonists(parsed.domicilio_id);
    const config = await repositories.fractionations.getConfig(actor.fraccionamiento_id);
    const limit = config?.max_usuarios_por_domicilio ?? 2;

    if (parsed.estatus === "ACTIVO" && activeColonists >= limit) {
      throw new AppError(`No se permite mas de ${limit} colonos activos por domicilio.`);
    }
  }

  const user = await repositories.users.create({
    auth_user_id: parsed.auth_user_id,
    fraccionamiento_id: parsed.fraccionamiento_id ?? null,
    domicilio_id: parsed.domicilio_id ?? null,
    nombre: parsed.nombre,
    email: parsed.email,
    rol: parsed.rol,
    estatus: parsed.estatus
  });

  await auditAction({
    actor,
    action: "USUARIO_CREAR",
    entityType: "perfiles_usuario",
    entityId: user.id,
    fraccionamientoId: user.fraccionamiento_id,
    domicilioId: user.domicilio_id,
    newValues: toJson({
      id: user.id,
      email: user.email,
      rol: user.rol,
      estatus: user.estatus
    })
  });

  return user;
}

export async function updateUserStatus(input: unknown) {
  const parsed = updateUserStatusSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);
  const current = await repositories.users.findById(parsed.id);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  if (!current || current.fraccionamiento_id !== actor.fraccionamiento_id || current.rol === "SUPERADMIN") {
    throw new ForbiddenError();
  }

  if (parsed.estatus === "ACTIVO" && current.rol === "COLONO" && current.domicilio_id) {
    const activeColonists = await repositories.users.countActiveColonists(current.domicilio_id);
    const config = await repositories.fractionations.getConfig(current.fraccionamiento_id);
    const limit = config?.max_usuarios_por_domicilio ?? 2;

    if (current.estatus !== "ACTIVO" && activeColonists >= limit) {
      throw new AppError(`No se permite mas de ${limit} colonos activos por domicilio.`);
    }
  }

  const updated = await repositories.users.updateStatus(parsed.id, parsed.estatus, actor.id);

  await auditAction({
    actor,
    action: parsed.estatus === "ACTIVO" ? "USUARIO_ACTIVAR" : "USUARIO_DESACTIVAR",
    entityType: "perfiles_usuario",
    entityId: updated.id,
    fraccionamientoId: updated.fraccionamiento_id,
    domicilioId: updated.domicilio_id,
    previousValues: toJson({ estatus: current.estatus }),
    newValues: toJson({ estatus: updated.estatus })
  });

  return updated;
}

export async function createNotice(input: unknown) {
  const parsed = createNoticeSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const notice = await repositories.notices.create({
    fraccionamiento_id: actor.fraccionamiento_id,
    titulo: parsed.titulo,
    mensaje: parsed.mensaje,
    prioridad: parsed.prioridad,
    fecha_inicio: new Date(parsed.fecha_inicio).toISOString(),
    fecha_fin: new Date(parsed.fecha_fin).toISOString(),
    created_by: actor.id
  });

  await auditAction({
    actor,
    action: "AVISO_CREAR",
    entityType: "avisos_generales",
    entityId: notice.id,
    fraccionamientoId: notice.fraccionamiento_id,
    newValues: toJson(notice)
  });

  return notice;
}

export async function sendInternalMessage(input: unknown) {
  const parsed = createMessageSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const recipients = await repositories.users.listMessageRecipients(actor.fraccionamiento_id);
  const allowedRecipientIds = new Set(recipients.map((recipient) => recipient.id));
  const invalid = parsed.recipient_ids.some((recipientId) => !allowedRecipientIds.has(recipientId));

  if (invalid) {
    throw new ForbiddenError("Hay destinatarios fuera de tu fraccionamiento.");
  }

  const messages = await repositories.messages.createMany(
    parsed.recipient_ids.map((recipientId) => ({
      fraccionamiento_id: actor.fraccionamiento_id as string,
      sender_id: actor.id,
      recipient_id: recipientId,
      titulo: parsed.titulo,
      mensaje: parsed.mensaje
    }))
  );

  await auditAction({
    actor,
    action: "MENSAJE_ENVIAR",
    entityType: "mensajes_administrativos",
    fraccionamientoId: actor.fraccionamiento_id,
    metadata: toJson({
      total_destinatarios: parsed.recipient_ids.length,
      message_ids: messages.map((message) => message.id)
    })
  });

  return messages;
}
