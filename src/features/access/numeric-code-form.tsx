"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { Hash, QrCode, Search } from "lucide-react";
import { AccessDecisionPanel } from "@/features/access/access-decision-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateNumericCodeAction, type ValidationState } from "@/server/actions/access.actions";

const initialState: ValidationState = { ok: true, data: undefined };

export function NumericCodeForm() {
  const [state, formAction, pending] = useActionState(validateNumericCodeAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Capturar codigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={formAction} className="space-y-3">
            <label htmlFor="code" className="sr-only">
              Codigo de 6 digitos
            </label>
            <input
              ref={inputRef}
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="------"
              // Solo numeros; limpia cualquier caracter pegado que no sea digito.
              onInput={(event) => {
                const el = event.currentTarget;
                el.value = el.value.replace(/\D/g, "").slice(0, 6);
              }}
              className="w-full rounded-xl border bg-white py-5 text-center text-4xl font-semibold tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="h-14 w-full text-lg" disabled={pending}>
              <Hash className="h-5 w-5" aria-hidden="true" />
              {pending ? "Validando..." : "Validar codigo"}
            </Button>
          </form>

          {!state.ok ? (
            <p className="rounded-md bg-red-50 p-2 text-center text-sm font-medium text-red-700">{state.error}</p>
          ) : null}

          <div className="flex gap-2 border-t pt-3">
            <Link href="/caseta/escanear" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                <QrCode className="h-4 w-4" aria-hidden="true" />
                Escanear QR
              </Button>
            </Link>
            <Link href="/caseta/buscar" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                <Search className="h-4 w-4" aria-hidden="true" />
                Buscar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <AccessDecisionPanel result={state.ok ? state.data : undefined} method="CODIGO_NUMERICO" />
    </div>
  );
}
