"use server";

import { revalidatePath } from "next/cache";
import {
  decideAccess,
  registerNotFoundAccess,
  validateNumericCode,
  validateQr
} from "@/lib/services/access.service";
import { actionFailure, formDataObject } from "@/server/actions/helpers";
import type { ActionResponse, InvitationValidationResult } from "@/types/domain";

export type ValidationState = ActionResponse<InvitationValidationResult>;

export async function validateQrAction(
  _previousState: ValidationState,
  formData: FormData
): Promise<ValidationState> {
  try {
    return { ok: true, data: await validateQr(formDataObject(formData)) };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function validateNumericCodeAction(
  _previousState: ValidationState,
  formData: FormData
): Promise<ValidationState> {
  try {
    return { ok: true, data: await validateNumericCode(formDataObject(formData)) };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function decideAccessAction(formData: FormData) {
  await decideAccess(formDataObject(formData));
  revalidatePath("/caseta");
  revalidatePath("/caseta/accesos");
}

export async function registerNotFoundAccessAction(formData: FormData) {
  await registerNotFoundAccess(formDataObject(formData));
  revalidatePath("/caseta");
  revalidatePath("/caseta/accesos");
}
