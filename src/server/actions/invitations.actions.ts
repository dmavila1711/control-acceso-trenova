"use server";

import { revalidatePath } from "next/cache";
import { cancelInvitation, createInvitation } from "@/lib/services/invitations.service";
import { actionFailure, formDataObject } from "@/server/actions/helpers";
import type { ActionResponse } from "@/types/domain";

export type CreateInvitationState = ActionResponse<{
  invitationId: string;
  qrPayload: string;
  numericCode: string;
  fractionationName: string;
  visitante: string;
  fechaFin: string;
}>;

export async function createInvitationAction(
  _previousState: CreateInvitationState,
  formData: FormData
): Promise<CreateInvitationState> {
  try {
    const result = await createInvitation(formDataObject(formData));
    revalidatePath("/app");
    revalidatePath("/app/invitaciones");

    return {
      ok: true,
      data: {
        invitationId: result.invitation.id,
        qrPayload: result.qrPayload,
        numericCode: result.numericCode,
        fractionationName: result.fractionationName,
        visitante: result.invitation.nombre_visitante,
        fechaFin: result.invitation.fecha_fin
      },
      message: "Invitacion creada."
    };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function cancelInvitationAction(formData: FormData) {
  await cancelInvitation(String(formData.get("id") ?? ""));
  revalidatePath("/app/invitaciones");
}

// Cancelacion desde administracion (el servicio valida rol y fraccionamiento).
export async function adminCancelInvitationAction(formData: FormData) {
  await cancelInvitation(String(formData.get("id") ?? ""));
  revalidatePath("/admin/invitaciones");
}
