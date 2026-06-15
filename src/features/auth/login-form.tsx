"use client";

import { useActionState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, magicLinkAction } from "@/server/actions/auth.actions";

const initialState = { ok: true as const, data: undefined };

export function LoginForm() {
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState);
  const [magicState, magicFormAction, magicPending] = useActionState(magicLinkAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={loginFormAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {!loginState.ok ? <p className="text-sm text-red-700">{loginState.error}</p> : null}
          <Button className="w-full" disabled={loginPending}>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {loginPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <form action={magicFormAction} className="space-y-3 border-t pt-5">
          <p className="text-sm text-muted-foreground">Tambien puedes pedir un enlace de acceso por email.</p>
          <Input name="email" type="email" placeholder="tu@email.com" />
          {!magicState.ok ? <p className="text-sm text-red-700">{magicState.error}</p> : null}
          {magicState.ok && magicState.message ? <p className="text-sm text-emerald-700">{magicState.message}</p> : null}
          <Button type="submit" variant="secondary" className="w-full" disabled={magicPending}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Enviar magic link
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
