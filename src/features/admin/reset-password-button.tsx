"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetUserPasswordAction } from "@/server/actions/admin.actions";
import type { ActionResponse } from "@/types/domain";

const initialState: ActionResponse<{ password: string; email: string }> = { ok: true, data: undefined };

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(resetUserPasswordAction, initialState);

  return (
    <div className="space-y-1">
      <form action={formAction}>
        <input type="hidden" name="id" value={userId} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {pending ? "Generando..." : "Regenerar acceso"}
        </Button>
      </form>
      {state.ok && state.data ? (
        <p className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-800">
          Nueva contrasena para <strong>{state.data.email}</strong>:{" "}
          <span className="font-mono font-semibold">{state.data.password}</span>
          <br />
          Compartela con el usuario; podra cambiarla al iniciar sesion.
        </p>
      ) : null}
      {!state.ok ? <p className="text-xs text-red-700">{state.error}</p> : null}
    </div>
  );
}
