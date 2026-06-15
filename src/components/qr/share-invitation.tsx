"use client";

import { Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export function ShareInvitation({
  fractionationName,
  visitorName,
  numericCode,
  expiresAt
}: {
  fractionationName: string;
  visitorName: string;
  numericCode: string;
  expiresAt: string;
}) {
  const text = `Invitacion para ${fractionationName}\nVisitante: ${visitorName}\nVigencia: hasta ${formatDateTime(expiresAt)}\nCodigo numerico: ${numericCode}\nPresenta este QR o codigo numerico en caseta.`;

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "Invitacion de acceso", text });
      return;
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
