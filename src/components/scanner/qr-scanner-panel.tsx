"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Camera, QrCode } from "lucide-react";
import { AccessDecisionPanel } from "@/features/access/access-decision-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateQrAction, type ValidationState } from "@/server/actions/access.actions";

const initialState: ValidationState = { ok: true, data: undefined };

export function QrScannerPanel() {
  const [state, formAction, pending] = useActionState(validateQrAction, initialState);
  const [, startTransition] = useTransition();
  const scannerMounted = useRef(false);

  useEffect(() => {
    let cleanup: (() => Promise<void>) | undefined;

    async function setup() {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      if (scannerMounted.current) {
        return;
      }
      scannerMounted.current = true;
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 8,
          qrbox: { width: 260, height: 260 },
          rememberLastUsedCamera: true
        },
        false
      );

      scanner.render((decodedText) => {
        const formData = new FormData();
        formData.set("qrPayload", decodedText);
        startTransition(() => formAction(formData));
      }, () => undefined);

      cleanup = async () => {
        await scanner.clear().catch(() => undefined);
      };
    }

    setup().catch(() => undefined);

    return () => {
      cleanup?.();
    };
  }, [formAction, startTransition]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Escanear QR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div id="qr-reader" className="overflow-hidden rounded-lg border bg-white" />
          <form action={formAction} className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="qrPayload">QR manual</Label>
              <Input id="qrPayload" name="qrPayload" placeholder="access:..." />
            </div>
            <Button disabled={pending}>
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Validar QR
            </Button>
          </form>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" aria-hidden="true" />
            El navegador pedira permiso de camara.
          </p>
          {!state.ok ? <p className="text-sm text-red-700">{state.error}</p> : null}
        </CardContent>
      </Card>
      <AccessDecisionPanel result={state.ok ? state.data : undefined} method="QR" />
    </div>
  );
}
