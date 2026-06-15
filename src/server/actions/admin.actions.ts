"use server";

import { revalidatePath } from "next/cache";
import {
  createHousehold,
  createNotice,
  createUser,
  sendInternalMessage,
  updateHouseholdStatus,
  updateUserStatus
} from "@/lib/services/admin.service";
import { formDataObject, formDataStringArray } from "@/server/actions/helpers";

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

export async function updateUserStatusAction(formData: FormData) {
  await updateUserStatus(formDataObject(formData));
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/guardias");
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
