"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export function QRDisplay({ value, downloadName = "invitacion-qr" }: { value: string; downloadName?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M"
    })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [value]);

  if (!src) {
    return (
      <div className="grid aspect-square w-64 place-items-center rounded-lg border bg-white text-sm text-muted-foreground">
        Generando QR
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Image
        src={src}
        alt="Codigo QR de invitacion"
        width={256}
        height={256}
        unoptimized
        className="aspect-square w-64 rounded-lg border bg-white p-3"
      />
      <a href={src} download={`${downloadName}.png`}>
        <Button type="button" variant="secondary" size="sm">
          <Download className="h-4 w-4" aria-hidden="true" />
          Descargar QR
        </Button>
      </a>
    </div>
  );
}
