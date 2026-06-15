import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createFractionationAction,
  reactivateFractionationAction,
  suspendFractionationAction
} from "@/server/actions/superadmin.actions";
import { getSuperadminFractionations } from "@/server/queries/superadmin";

export default async function SuperadminFractionationsPage() {
  const fractionations = await getSuperadminFractionations();

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Crear fraccionamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFractionationAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Direccion</Label>
              <Input id="direccion" name="direccion" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto_admin">Contacto admin</Label>
              <Input id="contacto_admin" name="contacto_admin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_contacto">Email contacto</Label>
              <Input id="email_contacto" name="email_contacto" type="email" />
            </div>
            <Button className="w-full">Crear fraccionamiento</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fraccionamientos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fractionations.map((fractionation) => (
            <div key={fractionation.id} className="rounded-md border p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <Link href={`/superadmin/fraccionamientos/${fractionation.id}`} className="min-w-0">
                  <p className="font-medium">{fractionation.nombre}</p>
                  <p className="text-sm text-muted-foreground">{fractionation.estatus} · {fractionation.direccion ?? "Sin direccion"}</p>
                </Link>
                {fractionation.estatus === "SUSPENDIDO" ? (
                  <form action={reactivateFractionationAction}>
                    <input type="hidden" name="id" value={fractionation.id} />
                    <Button variant="secondary" size="sm">Reactivar</Button>
                  </form>
                ) : (
                  <form action={suspendFractionationAction} className="flex gap-2">
                    <input type="hidden" name="id" value={fractionation.id} />
                    <Textarea name="suspension_reason" placeholder="Motivo" className="min-h-10 w-44" required />
                    <Button variant="danger" size="sm">Suspender</Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
