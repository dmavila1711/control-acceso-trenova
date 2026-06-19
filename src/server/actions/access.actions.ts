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

export type DecisionState = ActionResponse<{ resultado: string }>;

export async function decideAccessAction(
  _previousState: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  try {
    const values = formDataObject(formData);
    await decideAccess(values);
    revalidatePath("/caseta");
    revalidatePath("/caseta/accesos");
    return { ok: true, data: { resultado: String(values.resultado ?? "") } };
  } catch (error) {
    return actionFailure(error) as DecisionState;
  }
}

export async function registerNotFoundAccessAction(formData: FormData) {
  await registerNotFoundAccess(formDataObject(formData));
  revalidatePath("/caseta");
  revalidatePath("/caseta/accesos");
}
