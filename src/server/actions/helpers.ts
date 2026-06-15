import { ZodError } from "zod";
import { errorMessage } from "@/lib/errors";
import type { ActionResponse } from "@/types/domain";

export function formDataObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function formDataStringArray(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value));
}

export function actionFailure(error: unknown): ActionResponse {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    const flattened = error.flatten().fieldErrors;
    Object.entries(flattened).forEach(([key, value]) => {
      if (value) {
        fieldErrors[key] = value;
      }
    });

    return {
      ok: false,
      error: "Revisa los campos marcados.",
      fieldErrors
    };
  }

  return {
    ok: false,
    error: errorMessage(error)
  };
}
