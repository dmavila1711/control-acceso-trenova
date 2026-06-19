"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createUserWithAccountAction } from "@/server/actions/admin.actions";
import type { ActionResponse } from "@/types/domain";

type HouseholdOption = { id: string; calle: string; numero_exterior: string };

const initialState: ActionResponse = { ok: true, data: undefined };

export function AdminCreateUserForm({
  households,
  lockedRole,
  title = "Crear usuario"
}: {
  households: HouseholdOption[];
  // Cuando se fija un rol (p. ej. "GUARDIA"), se oculta el selector de rol y el
  // domicilio; el formulario crea siempre ese rol.
  lockedRole?: "GUARDIA";
  title?: string;
}) {
  const [state, formAction, pending] = useActionState(createUserWithAccountAction, initialState);
  const [rol, setRol] = useState<string>(lockedRole ?? "COLONO");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          {lockedRole ? <input type="hidden" name="rol" value={lockedRole} /> : null}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contrasena temporal</Label>
            <Input id="password" name="password" type="text" minLength={8} required />
            <p className="text-xs text-muted-foreground">
              Minimo 8 caracteres. Compartela con el usuario; podra cambiarla despues.
            </p>
          </div>
          {lockedRole ? null : (
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select id="rol" name="rol" value={rol} onChange={(event) => setRol(event.target.value)}>
                <option value="COLONO">Colono</option>
                <option value="GUARDIA">Guardia</option>
                <option value="ADMINISTRACION">Administracion</option>
              </Select>
            </div>
          )}
          {rol === "COLONO" ? (
            <div className="space-y-2">
              <Label htmlFor="domicilio_id">Domicilio</Label>
              <Select id="domicilio_id" name="domicilio_id" defaultValue="">
                <option value="" disabled>
                  Selecciona un domicilio
                </option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.calle} {household.numero_exterior}
                  </option>
                ))}
              </Select>
              {households.length === 0 ? (
                <p className="text-xs text-amber-700">
                  Primero crea domicilios para poder asignar colonos.
                </p>
              ) : null}
            </div>
          ) : null}

          {!state.ok ? <p className="text-sm text-red-700">{state.error}</p> : null}
          {state.ok && state.message ? (
            <p className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{state.message}</p>
          ) : null}

          <Button className="w-full" disabled={pending}>
            {pending ? "Creando..." : "Crear usuario"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
