"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { decideAccessAction } from "@/server/actions/access.actions";
import type { InvitationValidationResult, ValidationMethod } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";

export function AccessDecisionPanel({
  result,
  method
}: {
  result: InvitationValidationResult | undefined;
  method: ValidationMethod;
}) {
  if (!result) {
    return null;
  }

  if (result.status === "INVALIDA") {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="font-semibold text-red-700">Acceso no validado</p>
          <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitacion valida</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p><span className="text-muted-foreground">Visitante:</span> {result.visitante}</p>
          <p><span className="text-muted-foreground">Tipo:</span> {result.tipoVisita.replaceAll("_", " ")}</p>
          <p><span className="text-muted-foreground">Inicio:</span> {formatDateTime(result.vigencia.inicio)}</p>
          <p><span className="text-muted-foreground">Fin:</span> {formatDateTime(result.vigencia.fin)}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <form action={decideAccessAction} className="space-y-2">
            <input type="hidden" name="invitacion_id" value={result.invitacionId} />
            <input type="hidden" name="metodo_validacion" value={method} />
            <input type="hidden" name="resultado" value="PERMITIDO" />
            <Textarea name="observaciones" placeholder="Observaciones de entrada" />
            <Button className="w-full">
              <Check className="h-4 w-4" aria-hidden="true" />
              Permitir entrada
            </Button>
          </form>
          <form action={decideAccessAction} className="space-y-2">
            <input type="hidden" name="invitacion_id" value={result.invitacionId} />
            <input type="hidden" name="metodo_validacion" value={method} />
            <input type="hidden" name="resultado" value="RECHAZADO" />
            <Textarea name="observaciones" placeholder="Motivo del rechazo" />
            <Button className="w-full" variant="danger">
              <X className="h-4 w-4" aria-hidden="true" />
              Rechazar acceso
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
