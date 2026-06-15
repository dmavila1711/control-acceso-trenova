"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRDisplay({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M"
    }).then(setSrc).catch(() => setSrc(null));
  }, [value]);

  if (!src) {
    return <div className="grid aspect-square w-64 place-items-center rounded-lg border bg-white text-sm text-muted-foreground">Generando QR</div>;
  }

  return (
    <Image
      src={src}
      alt="Codigo QR de invitacion"
      width={256}
      height={256}
      unoptimized
      className="aspect-square w-64 rounded-lg border bg-white p-3"
    />
  );
}
