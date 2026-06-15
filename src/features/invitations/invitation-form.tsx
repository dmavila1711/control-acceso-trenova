"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QRDisplay } from "@/components/qr/qr-display";
import { ShareInvitation } from "@/components/qr/share-invitation";
import { createInvitationAction, type CreateInvitationState } from "@/server/actions/invitations.actions";
import type { CreateInvitationInput } from "@/lib/validators/invitations";

const initialState: CreateInvitationState = { ok: true, data: undefined };

export function InvitationForm() {
  const [state, formAction, pending] = useActionState(createInvitationAction, initialState);
  const { register, watch } = useForm<CreateInvitationInput>({
    defaultValues: {
      tipo_visita: "VISITA",
      tipo_autorizacion: "UN_DIA"
    }
  });
  const tipoAutorizacion = watch("tipo_autorizacion");

  if (state.ok && state.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitacion creada</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-[280px_1fr]">
          <QRDisplay value={state.data.qrPayload} />
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Codigo numerico</p>
              <p className="mt-1 text-4xl font-semibold tracking-normal">{state.data.numericCode}</p>
            </div>
            <ShareInvitation
              fractionationName={state.data.fractionationName}
              visitorName={state.data.visitante}
              numericCode={state.data.numericCode}
              expiresAt={state.data.fechaFin}
            />
            <Link
              href="/app/invitaciones"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-secondary px-4 font-medium text-secondary-foreground transition hover:bg-secondary/80"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver a mis invitaciones
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva invitacion</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tipo_visita">Tipo de visita</Label>
            <Select id="tipo_visita" required {...register("tipo_visita")}>
              <option value="VISITA">Visita</option>
              <option value="TRANSPORTE">Transporte</option>
              <option value="PAQUETERIA_MENSAJERIA">Paqueteria / mensajeria</option>
              <option value="SERVICIO_PROVEEDOR">Servicio / proveedor</option>
              <option value="OTRO">Otro</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre_visitante">Nombre visitante</Label>
            <Input id="nombre_visitante" required {...register("nombre_visitante")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa</Label>
            <Input id="empresa" {...register("empresa")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono_visitante">Telefono</Label>
            <Input id="telefono_visitante" inputMode="tel" {...register("telefono_visitante")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placas">Placas</Label>
            <Input id="placas" {...register("placas")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo_autorizacion">Tipo autorizacion</Label>
            <Select id="tipo_autorizacion" required {...register("tipo_autorizacion")}>
              <option value="UN_DIA">Un dia</option>
              <option value="HOY_MANANA">Hoy y manana</option>
              <option value="VISITA_FRECUENTE">Visita frecuente</option>
              <option value="EN_CASETA">En caseta</option>
            </Select>
          </div>
          {tipoAutorizacion === "UN_DIA" ? (
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de la visita</Label>
              <Input id="fecha" type="date" required {...register("fecha")} />
            </div>
          ) : null}
          {tipoAutorizacion === "VISITA_FRECUENTE" ? (
            <div className="space-y-2">
              <Label htmlFor="fecha_fin">Vigente hasta</Label>
              <Input id="fecha_fin" type="date" required {...register("fecha_fin")} />
              <p className="text-xs text-muted-foreground">Maximo 90 dias desde hoy.</p>
            </div>
          ) : null}
          {tipoAutorizacion === "HOY_MANANA" ? (
            <p className="self-end text-sm text-muted-foreground md:col-span-1">
              Vigente desde ahora y hasta el final de manana.
            </p>
          ) : null}
          {tipoAutorizacion === "EN_CASETA" ? (
            <p className="self-end text-sm text-muted-foreground md:col-span-1">
              Vigente solo el dia de hoy. La autorizacion se confirma en caseta.
            </p>
          ) : null}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea id="observaciones" {...register("observaciones")} />
          </div>
          {!state.ok ? <p className="text-sm text-red-700 md:col-span-2">{state.error}</p> : null}
          <div className="md:col-span-2">
            <Button disabled={pending}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              {pending ? "Creando..." : "Crear invitacion"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
