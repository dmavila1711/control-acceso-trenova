import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminCreateUserForm } from "@/features/admin/create-user-form";
import { ResetPasswordButton } from "@/features/admin/reset-password-button";
import { updateUserStatusAction } from "@/server/actions/admin.actions";
import { getAdminHouseholds, getAdminUsers } from "@/server/queries/admin";

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
            <div key={user.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
