import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createUserAction, updateUserStatusAction } from "@/server/actions/admin.actions";
import { getAdminHouseholds, getAdminUsers } from "@/server/queries/admin";

export default async function AdminUsersPage() {
  const [users, households] = await Promise.all([getAdminUsers(), getAdminHouseholds()]);
  const fractionationId = users.find((user) => user.fraccionamiento_id)?.fraccionamiento_id ?? households[0]?.fraccionamiento_id ?? "";

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Crear usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="space-y-3">
            <input type="hidden" name="fraccionamiento_id" value={fractionationId} />
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
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select id="rol" name="rol" defaultValue="COLONO">
                <option value="COLONO">Colono</option>
                <option value="GUARDIA">Guardia</option>
                <option value="ADMINISTRACION">Administracion</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="domicilio_id">Domicilio para colono</Label>
              <Select id="domicilio_id" name="domicilio_id" defaultValue="">
                <option value="">Sin domicilio</option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.calle} {household.numero_exterior}
                  </option>
                ))}
              </Select>
            </div>
            <Button className="w-full">Crear usuario</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{user.nombre}</p>
                <p className="text-sm text-muted-foreground">{user.email} · {user.rol} · {user.estatus}</p>
              </div>
              {user.rol !== "SUPERADMIN" ? (
                <form action={updateUserStatusAction}>
                  <input type="hidden" name="id" value={user.id} />
                  <input type="hidden" name="estatus" value={user.estatus === "ACTIVO" ? "INACTIVO" : "ACTIVO"} />
                  <Button variant="secondary" size="sm">{user.estatus === "ACTIVO" ? "Desactivar" : "Activar"}</Button>
                </form>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
