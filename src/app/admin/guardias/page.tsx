import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserAction, updateUserStatusAction } from "@/server/actions/admin.actions";
import { getAdminUsers } from "@/server/queries/admin";

export default async function AdminGuardsPage() {
  const users = await getAdminUsers();
  const guards = users.filter((user) => user.rol === "GUARDIA");
  const fractionationId = users.find((user) => user.fraccionamiento_id)?.fraccionamiento_id ?? "";

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Crear guardia</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="space-y-3">
            <input type="hidden" name="fraccionamiento_id" value={fractionationId} />
            <input type="hidden" name="rol" value="GUARDIA" />
            <div className="space-y-2">
              <Label htmlFor="auth_user_id">Auth user ID</Label>
              <Input id="auth_user_id" name="auth_user_id" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button className="w-full">Crear guardia</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Guardias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {guards.map((guard) => (
            <div key={guard.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{guard.nombre}</p>
                <p className="text-sm text-muted-foreground">{guard.email} · {guard.estatus}</p>
              </div>
              <form action={updateUserStatusAction}>
                <input type="hidden" name="id" value={guard.id} />
                <input type="hidden" name="estatus" value={guard.estatus === "ACTIVO" ? "INACTIVO" : "ACTIVO"} />
                <Button variant="secondary" size="sm">{guard.estatus === "ACTIVO" ? "Desactivar" : "Activar"}</Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
