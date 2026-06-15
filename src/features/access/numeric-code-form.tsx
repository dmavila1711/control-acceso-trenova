"use client";

import { useActionState } from "react";
import { Hash } from "lucide-react";
import { AccessDecisionPanel } from "@/features/access/access-decision-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateNumericCodeAction, type ValidationState } from "@/server/actions/access.actions";

const initialState: ValidationState = { ok: true, data: undefined };

export function NumericCodeForm() {
  const [state, formAction, pending] = useActionState(validateNumericCodeAction, initialState);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Validar codigo numerico</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="code">Codigo de 6 digitos</Label>
              <Input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
            </div>
            <Button disabled={pending}>
              <Hash className="h-4 w-4" aria-hidden="true" />
              Validar
            </Button>
          </form>
          {!state.ok ? <p className="mt-3 text-sm text-red-700">{state.error}</p> : null}
        </CardContent>
      </Card>
      <AccessDecisionPanel result={state.ok ? state.data : undefined} method="CODIGO_NUMERICO" />
    </div>
  );
}
