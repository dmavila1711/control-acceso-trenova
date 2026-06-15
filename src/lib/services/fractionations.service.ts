import { auditAction } from "@/lib/audit/audit";
import { getServiceContext } from "@/lib/services/context";
import { toJson } from "@/lib/utils";
import {
  createFractionationSchema,
  reactivateFractionationSchema,
  suspendFractionationSchema
} from "@/lib/validators/fractionations";

export async function createFractionation(input: unknown) {
  const parsed = createFractionationSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["SUPERADMIN"]);

  const fractionation = await repositories.fractionations.create({
    nombre: parsed.nombre,
    direccion: parsed.direccion || null,
    contacto_admin: parsed.contacto_admin || null,
    email_contacto: parsed.email_contacto || null
  });

  await auditAction({
    actor,
    action: "FRACCIONAMIENTO_CREAR",
    entityType: "fraccionamientos",
    entityId: fractionation.id,
    fraccionamientoId: fractionation.id,
    newValues: toJson(fractionation)
  });

  return fractionation;
}

export async function suspendFractionation(input: unknown) {
  const parsed = suspendFractionationSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["SUPERADMIN"]);
  const current = await repositories.fractionations.findById(parsed.id);
  const fractionation = await repositories.fractionations.suspend(parsed.id, actor.id, parsed.suspension_reason);

  await auditAction({
    actor,
    action: "FRACCIONAMIENTO_SUSPENDER",
    entityType: "fraccionamientos",
    entityId: fractionation.id,
    fraccionamientoId: fractionation.id,
    previousValues: toJson(current),
    newValues: toJson({
      estatus: fractionation.estatus,
      suspended_at: fractionation.suspended_at,
      suspension_reason: fractionation.suspension_reason
    })
  });

  return fractionation;
}

export async function reactivateFractionation(input: unknown) {
  const parsed = reactivateFractionationSchema.parse(input);
  const { actor, repositories } = await getServiceContext(["SUPERADMIN"]);
  const current = await repositories.fractionations.findById(parsed.id);
  const fractionation = await repositories.fractionations.reactivate(parsed.id);

  await auditAction({
    actor,
    action: "FRACCIONAMIENTO_REACTIVAR",
    entityType: "fraccionamientos",
    entityId: fractionation.id,
    fraccionamientoId: fractionation.id,
    previousValues: toJson(current),
    newValues: toJson({ estatus: fractionation.estatus })
  });

  return fractionation;
}
