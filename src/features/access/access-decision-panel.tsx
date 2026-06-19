"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { decideAccessAction, type DecisionState } from "@/server/actions/access.actions";
import type { InvitationValidationResult, ValidationMethod } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";

const MOTIVOS_RECHAZO = [
  "Visitante no coincide",
  "Invitacion expirada",
  "Invitacion cancelada",
  "Datos incorrectos",
  "Instruccion de colono/administracion",
  "Otro"
];

const initialState: DecisionState = { ok: true, data: undefined };

export function AccessDecisionPanel({
  result,
  method
}: {
  result: InvitationValidationResult | undefined;
  method: ValidationMethod;
}) {
  const [decision, decideForm, deciding] = useActionState(decideAccessAction, initialState);

  if (!result) {
    return null;
  }

  // Confirmacion grande despues de decidir.
  if (decision.ok && decision.data) {
    const permitido = decision.data.resultado === "PERMITIDO";
    return (
      <Card>
        <CardContent className="space-y-4 p-6 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              permitido ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {permitido ? <Check className="h-8 w-8" aria-hidden="true" /> : <X className="h-8 w-8" aria-hidden="true" />}
          </div>
          <p className="text-xl font-semibold">{permitido ? "Entrada permitida" : "Acceso rechazado"}</p>
          <p className="text-sm text-muted-foreground">El registro quedo guardado.</p>
          <Link href="/caseta">
            <Button type="button" className="w-full">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Atender siguiente
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "INVALIDA") {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
            <ShieldAlert className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="text-lg font-semibold text-red-700">Acceso no validado</p>
          <p className="text-sm text-muted-foreground">{result.message}</p>
          <Link href="/caseta">
            <Button type="button" variant="secondary" className="w-full">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-emerald-700">Invitacion valida</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 rounded-md bg-secondary/40 p-3 text-sm md:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Visitante:</span>{" "}
            <span className="font-medium">{result.visitante}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Tipo:</span> {result.tipoVisita.replaceAll("_", " ")}
          </p>
          {result.domicilio ? (
            <p>
              <span className="text-muted-foreground">Domicilio:</span> {result.domicilio}
            </p>
          ) : null}
          {result.placas ? (
            <p>
              <span className="text-muted-foreground">Placas:</span> {result.placas}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">Vigente hasta:</span> {formatDateTime(result.vigencia.fin)}
          </p>
        </div>

        {!decision.ok ? <p className="text-sm text-red-700">{decision.error}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <form action={decideForm} className="space-y-2 rounded-md border border-emerald-200 p-3">
            <input type="hidden" name="invitacion_id" value={result.invitacionId} />
            <input type="hidden" name="metodo_validacion" value={method} />
            <input type="hidden" name="resultado" value="PERMITIDO" />
            <Textarea name="observaciones" placeholder="Observaciones (opcional)" rows={2} />
            <Button className="h-12 w-full text-base" disabled={deciding}>
              <Check className="h-5 w-5" aria-hidden="true" />
              Permitir entrada
            </Button>
          </form>

          <form action={decideForm} className="space-y-2 rounded-md border border-red-200 p-3">
            <input type="hidden" name="invitacion_id" value={result.invitacionId} />
            <input type="hidden" name="metodo_validacion" value={method} />
            <input type="hidden" name="resultado" value="RECHAZADO" />
            <Select name="observaciones" defaultValue="" required aria-label="Motivo del rechazo">
              <option value="" disabled>
                Motivo del rechazo
              </option>
              {MOTIVOS_RECHAZO.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </Select>
            <Button variant="danger" className="h-12 w-full text-base" disabled={deciding}>
              <X className="h-5 w-5" aria-hidden="true" />
              Rechazar acceso
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
