"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { Camera, Hash, QrCode, Search } from "lucide-react";
import { AccessDecisionPanel } from "@/features/access/access-decision-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateQrAction, type ValidationState } from "@/server/actions/access.actions";

const initialState: ValidationState = { ok: true, data: undefined };
const DEDUPE_MS = 4000;

export function QrScannerPanel() {
  const [state, formAction, pending] = useActionState(validateQrAction, initialState);
  const [, startTransition] = useTransition();
  const scannerMounted = useRef(false);
  // Evita disparar varias validaciones por el mismo QR en pocos segundos.
  const lastScan = useRef<{ text: string; at: number }>({ text: "", at: 0 });

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
        const now = Date.now();
        if (decodedText === lastScan.current.text && now - lastScan.current.at < DEDUPE_MS) {
          return;
        }
        lastScan.current = { text: decodedText, at: now };
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
          {pending ? (
            <p className="rounded-md bg-secondary/60 p-2 text-center text-sm font-medium">Validando QR...</p>
          ) : null}
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" aria-hidden="true" />
            El navegador pedira permiso de camara. Centra el QR en el recuadro.
          </p>

          <details className="rounded-md border bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">No puedo escanear</summary>
            <div className="space-y-3 border-t p-3">
              <form action={formAction} className="flex flex-col gap-2">
                <Label htmlFor="qrPayload">Capturar QR manual</Label>
                <Input id="qrPayload" name="qrPayload" placeholder="access:..." />
                <Button disabled={pending} variant="secondary">
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  Validar QR manual
                </Button>
              </form>
              <div className="flex gap-2">
                <Link href="/caseta/codigo" className="flex-1">
                  <Button type="button" variant="secondary" className="w-full">
                    <Hash className="h-4 w-4" aria-hidden="true" />
                    Capturar codigo
                  </Button>
                </Link>
                <Link href="/caseta/buscar" className="flex-1">
                  <Button type="button" variant="secondary" className="w-full">
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Buscar
                  </Button>
                </Link>
              </div>
            </div>
          </details>

          {!state.ok ? (
            <p className="rounded-md bg-red-50 p-2 text-center text-sm font-medium text-red-700">{state.error}</p>
          ) : null}
        </CardContent>
      </Card>
      <AccessDecisionPanel result={state.ok ? state.data : undefined} method="QR" />
    </div>
  );
}
