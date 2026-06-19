"use client";

import { useEffect, useState } from "react";
import { Copy, Send } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export function ShareInvitation({
  fractionationName,
  visitorName,
  numericCode,
  expiresAt,
  qrValue
}: {
  fractionationName: string;
  visitorName: string;
  numericCode: string;
  expiresAt: string;
  // Valor opaco del QR (ej. "access:..."). Si se provee, se intenta compartir la
  // imagen del QR ademas del texto.
  qrValue?: string;
}) {
  const [qrFile, setQrFile] = useState<File | null>(null);

  const text = `Te comparto tu acceso a ${fractionationName}.\nVisitante: ${visitorName}\nPresenta este QR en caseta. Si no se puede escanear, proporciona el codigo: ${numericCode}.\nVigente hasta: ${formatDateTime(expiresAt)}.`;

  useEffect(() => {
    if (!qrValue) {
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(qrValue, { width: 320, margin: 2, errorCorrectionLevel: "M" })
      .then(async (dataUrl) => {
        const blob = await (await fetch(dataUrl)).blob();
        if (!cancelled) {
          setQrFile(new File([blob], "invitacion-qr.png", { type: "image/png" }));
        }
      })
      .catch(() => setQrFile(null));
    return () => {
      cancelled = true;
    };
  }, [qrValue]);

  async function share() {
    // Web Share nivel 2: compartir la imagen del QR junto al texto si el
    // dispositivo lo permite (típico en celulares).
    if (qrFile && navigator.canShare?.({ files: [qrFile] })) {
      try {
        await navigator.share({ title: "Invitacion de acceso", text, files: [qrFile] });
        return;
      } catch {
        // El usuario canceló o el navegador no aceptó archivos; seguimos con texto.
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "Invitacion de acceso", text });
        return;
      } catch {
        // cae al fallback de WhatsApp web
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function copy() {
    await navigator.clipboard.writeText(numericCode);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={share}>
        <Send className="h-4 w-4" aria-hidden="true" />
        Compartir por WhatsApp
      </Button>
      <Button type="button" variant="secondary" onClick={copy}>
        <Copy className="h-4 w-4" aria-hidden="true" />
        Copiar codigo
      </Button>
    </div>
  );
}
