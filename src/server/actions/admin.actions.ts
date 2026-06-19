"use server";

import { revalidatePath } from "next/cache";
import {
  createHousehold,
  createNotice,
  createUser,
  createUserWithAccount,
  importHouseholds,
  resetUserPassword,
  sendInternalMessage,
  updateHouseholdStatus,
  updateUserStatus,
  type ImportResult
} from "@/lib/services/admin.service";
import { actionFailure, formDataObject, formDataStringArray } from "@/server/actions/helpers";
import type { ActionResponse } from "@/types/domain";

export async function createHouseholdAction(formData: FormData) {
  await createHousehold(formDataObject(formData));
  revalidatePath("/admin/domicilios");
}

export async function updateHouseholdStatusAction(formData: FormData) {
  await updateHouseholdStatus(formDataObject(formData));
  revalidatePath("/admin/domicilios");
}

export async function createUserAction(formData: FormData) {
  await createUser(formDataObject(formData));
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/guardias");
}

// Alta con cuenta de acceso desde administracion. Devuelve estado para mostrar
// exito/error en la UI sin abandonar la pantalla.
export async function createUserWithAccountAction(
  _previousState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await createUserWithAccount(formDataObject(formData));
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/guardias");
    return {
      ok: true,
      message: `Usuario ${user.nombre} creado. Ya puede iniciar sesion con su email y contrasena.`
    };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateUserStatusAction(formData: FormData) {
  await updateUserStatus(formDataObject(formData));
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/guardias");
}

export async function resetUserPasswordAction(
  _previousState: ActionResponse<{ password: string; email: string }>,
  formData: FormData
): Promise<ActionResponse<{ password: string; email: string }>> {
  try {
    const result = await resetUserPassword(formDataObject(formData));
    return {
      ok: true,
      data: result,
      message: "Nueva contrasena temporal generada."
    };
  } catch (error) {
    return actionFailure(error) as ActionResponse<{ password: string; email: string }>;
  }
}

export async function importHouseholdsAction(
  rows: { calle: string; numero_exterior: string; numero_interior?: string; referencia?: string }[]
): Promise<ActionResponse<ImportResult>> {
  try {
    const result = await importHouseholds(rows);
    revalidatePath("/admin/domicilios");
    return {
      ok: true,
      data: result,
      message: `Se importaron ${result.inserted} domicilios${result.errors.length ? ` (${result.errors.length} con error)` : ""}.`
    };
  } catch (error) {
    return actionFailure(error) as ActionResponse<ImportResult>;
  }
}

export async function createNoticeAction(formData: FormData) {
  await createNotice(formDataObject(formData));
  revalidatePath("/admin/avisos");
}

export async function sendInternalMessageAction(formData: FormData) {
  await sendInternalMessage({
    ...formDataObject(formData),
    recipient_ids: formDataStringArray(formData, "recipient_ids")
  });
  revalidatePath("/admin/mensajes");
}
