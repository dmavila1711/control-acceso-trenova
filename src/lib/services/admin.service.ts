import { auditAction } from "@/lib/audit/audit";
import { AppError, ForbiddenError, errorMessage } from "@/lib/errors";
import { getServiceContext } from "@/lib/services/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toJson } from "@/lib/utils";
import { createHouseholdSchema, updateHouseholdStatusSchema } from "@/lib/validators/households";
import { createMessageSchema } from "@/lib/validators/messages";
import {
  createNoticeSchema,
  updateNoticeSchema,
  updateNoticeStatusSchema
} from "@/lib/validators/notices";
import type { NoticeSegment } from "@/types/domain";
import { randomBytes } from "node:crypto";
import {
  createUserSchema,
  createUserWithAccountSchema,
  resetUserPasswordSchema,
  updateUserSchema,
  updateUserStatusSchema
} from "@/lib/validators/users";

// Contrasena temporal legible (sin caracteres ambiguos) generada server-side.
function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

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

export type ImportResult = { inserted: number; errors: { row: number; message: string }[] };

export async function importHouseholds(rows: unknown): Promise<ImportResult> {
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }
  if (!Array.isArray(rows)) {
    throw new AppError("Formato de importacion invalido.");
  }
  if (rows.length === 0) {
    throw new AppError("No hay filas para importar.");
  }
  if (rows.length > 500) {
    throw new AppError("Maximo 500 domicilios por importacion.");
  }

  const errors: { row: number; message: string }[] = [];
  let inserted = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const parsed = createHouseholdSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push({ row: i + 1, message: parsed.error.issues[0]?.message ?? "Fila invalida." });
      continue;
    }

    try {
      await repositories.households.create({
        fraccionamiento_id: actor.fraccionamiento_id,
        calle: parsed.data.calle,
        numero_exterior: parsed.data.numero_exterior,
        numero_interior: parsed.data.numero_interior || null,
        referencia: parsed.data.referencia || null
      });
      inserted += 1;
    } catch (error) {
      errors.push({ row: i + 1, message: errorMessage(error) });
    }
  }

  await auditAction({
    actor,
    action: "DOMICILIOS_IMPORTAR",
    entityType: "domicilios",
    fraccionamientoId: actor.fraccionamiento_id,
    metadata: toJson({ inserted, errores: errors.length, total: rows.length })
  });

  return { inserted, errors };
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

export async function createUserWithAccount(input: unknown) {
  const parsed = createUserWithAccountSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  // El domicilio (para COLONO) debe pertenecer al fraccionamiento del admin, y se
  // valida el tope de colonos activos antes de crear la cuenta de acceso.
  if (parsed.rol === "COLONO" && parsed.domicilio_id) {
    const household = await repositories.households.findById(parsed.domicilio_id);
    if (!household || household.fraccionamiento_id !== actor.fraccionamiento_id) {
      throw new ForbiddenError("El domicilio no pertenece a tu fraccionamiento.");
    }

    const activeColonists = await repositories.users.countActiveColonists(parsed.domicilio_id);
    const config = await repositories.fractionations.getConfig(actor.fraccionamiento_id);
    const limit = config?.max_usuarios_por_domicilio ?? 2;
    if (activeColonists >= limit) {
      throw new AppError(`No se permite mas de ${limit} colonos activos por domicilio.`);
    }
  }

  // La cuenta Auth se crea con service role (server-side). La sesion del admin
  // no se ve afectada porque usamos un cliente admin sin persistencia.
  const admin = createSupabaseAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true
  });

  if (createError || !created?.user) {
    if (/already.*(registered|exists)/i.test(createError?.message ?? "")) {
      throw new AppError("Ya existe un usuario con ese email.");
    }
    throw new AppError("No se pudo crear la cuenta de acceso.");
  }

  const authUserId = created.user.id;

  try {
    const user = await repositories.users.create({
      auth_user_id: authUserId,
      fraccionamiento_id: actor.fraccionamiento_id,
      domicilio_id: parsed.rol === "COLONO" ? parsed.domicilio_id ?? null : null,
      nombre: parsed.nombre,
      email: parsed.email,
      rol: parsed.rol,
      estatus: "ACTIVO"
    });

    await auditAction({
      actor,
      action: "USUARIO_CREAR",
      entityType: "perfiles_usuario",
      entityId: user.id,
      fraccionamientoId: user.fraccionamiento_id,
      domicilioId: user.domicilio_id,
      newValues: toJson({ id: user.id, email: user.email, rol: user.rol, estatus: user.estatus })
    });

    return user;
  } catch (error) {
    // Si falla el perfil (p. ej. el trigger de limite de colonos), borramos la
    // cuenta Auth para no dejar usuarios huerfanos sin perfil.
    await admin.auth.admin.deleteUser(authUserId).catch(() => undefined);
    throw error;
  }
}

export async function updateUser(input: unknown) {
  const parsed = updateUserSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);
  const current = await repositories.users.findById(parsed.id);

  if (!current || current.fraccionamiento_id !== actor.fraccionamiento_id || current.rol === "SUPERADMIN") {
    throw new ForbiddenError();
  }

  const patch: { nombre?: string; domicilio_id?: string | null } = { nombre: parsed.nombre };

  // Reasignacion de domicilio: solo para colonos y dentro del fraccionamiento.
  if (current.rol === "COLONO") {
    const nuevoDomicilio = parsed.domicilio_id ?? null;
    if (nuevoDomicilio && nuevoDomicilio !== current.domicilio_id) {
      const household = await repositories.households.findById(nuevoDomicilio);
      if (!household || household.fraccionamiento_id !== actor.fraccionamiento_id) {
        throw new ForbiddenError("El domicilio no pertenece a tu fraccionamiento.");
      }
      if (current.estatus === "ACTIVO") {
        const activeColonists = await repositories.users.countActiveColonists(nuevoDomicilio);
        const config = await repositories.fractionations.getConfig(actor.fraccionamiento_id);
        const limit = config?.max_usuarios_por_domicilio ?? 2;
        if (activeColonists >= limit) {
          throw new AppError(`No se permite mas de ${limit} colonos activos por domicilio.`);
        }
      }
      patch.domicilio_id = nuevoDomicilio;
    }
  }

  const updated = await repositories.users.updateProfile(parsed.id, patch);

  await auditAction({
    actor,
    action: "USUARIO_EDITAR",
    entityType: "perfiles_usuario",
    entityId: updated.id,
    fraccionamientoId: updated.fraccionamiento_id,
    domicilioId: updated.domicilio_id,
    previousValues: toJson({ nombre: current.nombre, domicilio_id: current.domicilio_id }),
    newValues: toJson({ nombre: updated.nombre, domicilio_id: updated.domicilio_id })
  });

  return updated;
}

export async function resetUserPassword(input: unknown) {
  const parsed = resetUserPasswordSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);
  const current = await repositories.users.findById(parsed.id);

  if (!current || current.fraccionamiento_id !== actor.fraccionamiento_id || current.rol === "SUPERADMIN") {
    throw new ForbiddenError();
  }

  const password = generateTempPassword();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(current.auth_user_id, { password });
  if (error) {
    throw new AppError("No se pudo regenerar la contrasena.");
  }

  await auditAction({
    actor,
    action: "USUARIO_RESET_PASSWORD",
    entityType: "perfiles_usuario",
    entityId: current.id,
    fraccionamientoId: current.fraccionamiento_id,
    domicilioId: current.domicilio_id,
    metadata: toJson({ email: current.email })
  });

  return { password, email: current.email };
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

type SegmentInput = {
  segmento: NoticeSegment;
  segmento_calle?: string;
  segmento_domicilio_id?: string;
};
type SegmentTarget = { segmento_calle: string | null; segmento_domicilio_id: string | null };

// Normaliza el objetivo del segmento y, para DOMICILIO, valida que el domicilio
// pertenezca al fraccionamiento del administrador (defensa en profundidad). Los
// segmentos que no son CALLE/DOMICILIO quedan sin objetivo (coherente con el
// constraint de la migracion).
async function resolveSegmentTarget(
  parsed: SegmentInput,
  fraccionamientoId: string,
  households: { findById(id: string): Promise<{ fraccionamiento_id: string } | null> }
): Promise<SegmentTarget> {
  if (parsed.segmento === "DOMICILIO") {
    const id = parsed.segmento_domicilio_id ?? null;
    if (id) {
      const household = await households.findById(id);
      if (!household || household.fraccionamiento_id !== fraccionamientoId) {
        throw new ForbiddenError("El domicilio no pertenece a tu fraccionamiento.");
      }
    }
    return { segmento_calle: null, segmento_domicilio_id: id };
  }
  if (parsed.segmento === "CALLE") {
    return { segmento_calle: parsed.segmento_calle ?? null, segmento_domicilio_id: null };
  }
  return { segmento_calle: null, segmento_domicilio_id: null };
}

export async function createNotice(input: unknown) {
  const parsed = createNoticeSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const target = await resolveSegmentTarget(parsed, actor.fraccionamiento_id, repositories.households);

  const notice = await repositories.notices.create({
    fraccionamiento_id: actor.fraccionamiento_id,
    titulo: parsed.titulo,
    mensaje: parsed.mensaje,
    prioridad: parsed.prioridad,
    segmento: parsed.segmento,
    segmento_calle: target.segmento_calle,
    segmento_domicilio_id: target.segmento_domicilio_id,
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

export async function updateNotice(input: unknown) {
  const parsed = updateNoticeSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);
  const current = await repositories.notices.findById(parsed.id);

  if (!current || current.fraccionamiento_id !== actor.fraccionamiento_id) {
    throw new ForbiddenError();
  }

  const target = await resolveSegmentTarget(parsed, current.fraccionamiento_id, repositories.households);

  const updated = await repositories.notices.update(parsed.id, {
    titulo: parsed.titulo,
    mensaje: parsed.mensaje,
    prioridad: parsed.prioridad,
    segmento: parsed.segmento,
    segmento_calle: target.segmento_calle,
    segmento_domicilio_id: target.segmento_domicilio_id,
    fecha_inicio: new Date(parsed.fecha_inicio).toISOString(),
    fecha_fin: new Date(parsed.fecha_fin).toISOString()
  });

  await auditAction({
    actor,
    action: "AVISO_EDITAR",
    entityType: "avisos_generales",
    entityId: updated.id,
    fraccionamientoId: updated.fraccionamiento_id,
    previousValues: toJson({
      titulo: current.titulo,
      mensaje: current.mensaje,
      prioridad: current.prioridad,
      segmento: current.segmento,
      segmento_calle: current.segmento_calle,
      segmento_domicilio_id: current.segmento_domicilio_id,
      fecha_inicio: current.fecha_inicio,
      fecha_fin: current.fecha_fin
    }),
    newValues: toJson({
      titulo: updated.titulo,
      mensaje: updated.mensaje,
      prioridad: updated.prioridad,
      segmento: updated.segmento,
      segmento_calle: updated.segmento_calle,
      segmento_domicilio_id: updated.segmento_domicilio_id,
      fecha_inicio: updated.fecha_inicio,
      fecha_fin: updated.fecha_fin
    })
  });

  return updated;
}

export async function updateNoticeStatus(input: unknown) {
  const parsed = updateNoticeStatusSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);
  const current = await repositories.notices.findById(parsed.id);

  if (!current || current.fraccionamiento_id !== actor.fraccionamiento_id) {
    throw new ForbiddenError();
  }

  const updated = await repositories.notices.updateStatus(parsed.id, parsed.estatus);

  await auditAction({
    actor,
    action: "AVISO_CAMBIAR_ESTATUS",
    entityType: "avisos_generales",
    entityId: updated.id,
    fraccionamientoId: updated.fraccionamiento_id,
    previousValues: toJson({ estatus: current.estatus }),
    newValues: toJson({ estatus: updated.estatus })
  });

  return updated;
}

export async function sendInternalMessage(input: unknown) {
  const parsed = createMessageSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["ADMINISTRACION"]);

  if (!actor.fraccionamiento_id) {
    throw new ForbiddenError("Tu usuario no tiene fraccionamiento asignado.");
  }

  const recipients = await repositories.users.listMessageRecipients(actor.fraccionamiento_id);

  // Destinatarios: por grupo (se expande a usuarios activos del fraccionamiento) o
  // por seleccion explicita (validada contra el fraccionamiento del admin).
  let recipientIds: string[];
  if (parsed.group) {
    const byGroup = recipients.filter((recipient) => {
      if (parsed.group === "COLONOS") return recipient.rol === "COLONO";
      if (parsed.group === "GUARDIAS") return recipient.rol === "GUARDIA";
      return recipient.rol === "COLONO" || recipient.rol === "GUARDIA";
    });
    recipientIds = byGroup.map((recipient) => recipient.id);
  } else {
    const allowedRecipientIds = new Set(recipients.map((recipient) => recipient.id));
    const invalid = parsed.recipient_ids.some((recipientId) => !allowedRecipientIds.has(recipientId));
    if (invalid) {
      throw new ForbiddenError("Hay destinatarios fuera de tu fraccionamiento.");
    }
    recipientIds = parsed.recipient_ids;
  }

  if (recipientIds.length === 0) {
    throw new AppError("No hay destinatarios para este mensaje.");
  }

  const messages = await repositories.messages.createMany(
    recipientIds.map((recipientId) => ({
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
      total_destinatarios: recipientIds.length,
      grupo: parsed.group ?? null,
      message_ids: messages.map((message) => message.id)
    })
  });

  return messages;
}
