import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminCreateUserForm } from "@/features/admin/create-user-form";
import { ResetPasswordButton } from "@/features/admin/reset-password-button";
import { updateUserAction, updateUserStatusAction } from "@/server/actions/admin.actions";
import { getAdminHouseholds, getAdminUsers } from "@/server/queries/admin";
import { compactAddress } from "@/lib/utils";

export default async function AdminUsersPage() {
  const [users, households] = await Promise.all([getAdminUsers(), getAdminHouseholds()]);
  const householdOptions = households.map((household) => ({
    id: household.id,
    calle: household.calle,
    numero_exterior: household.numero_exterior
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <AdminCreateUserForm households={householdOptions} />

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-md border p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{user.nombre}</p>
                  <p className="text-sm text-muted-foreground">{user.email} · {user.rol} · {user.estatus}</p>
                </div>
                {user.rol !== "SUPERADMIN" ? (
                  <div className="flex flex-wrap items-start gap-2">
                    <ResetPasswordButton userId={user.id} />
                    <form action={updateUserStatusAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <input type="hidden" name="estatus" value={user.estatus === "ACTIVO" ? "INACTIVO" : "ACTIVO"} />
                      <Button variant="secondary" size="sm">{user.estatus === "ACTIVO" ? "Desactivar" : "Activar"}</Button>
                    </form>
                  </div>
                ) : null}
              </div>
              {user.rol !== "SUPERADMIN" ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-primary">Editar</summary>
                  <form action={updateUserAction} className="mt-2 flex flex-col gap-2 md:flex-row md:items-end">
                    <input type="hidden" name="id" value={user.id} />
                    <div className="flex-1 space-y-1">
                      <label htmlFor={`nombre-${user.id}`} className="text-xs text-muted-foreground">Nombre</label>
                      <Input id={`nombre-${user.id}`} name="nombre" defaultValue={user.nombre} required />
                    </div>
                    {user.rol === "COLONO" ? (
                      <div className="flex-1 space-y-1">
                        <label htmlFor={`dom-${user.id}`} className="text-xs text-muted-foreground">Domicilio</label>
                        <Select id={`dom-${user.id}`} name="domicilio_id" defaultValue={user.domicilio_id ?? ""}>
                          <option value="">Sin cambio</option>
                          {households.map((household) => (
                            <option key={household.id} value={household.id}>{compactAddress(household)}</option>
                          ))}
                        </Select>
                      </div>
                    ) : null}
                    <Button variant="secondary" size="sm">Guardar</Button>
                  </form>
                </details>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
