"use server";

import { revalidatePath } from "next/cache";
import {
  createFractionation,
  reactivateFractionation,
  suspendFractionation
} from "@/lib/services/fractionations.service";
import { formDataObject } from "@/server/actions/helpers";

export async function createFractionationAction(formData: FormData) {
  await createFractionation(formDataObject(formData));
  revalidatePath("/superadmin/fraccionamientos");
}

export async function suspendFractionationAction(formData: FormData) {
  await suspendFractionation(formDataObject(formData));
  revalidatePath("/superadmin/fraccionamientos");
}

export async function reactivateFractionationAction(formData: FormData) {
  await reactivateFractionation(formDataObject(formData));
  revalidatePath("/superadmin/fraccionamientos");
}
