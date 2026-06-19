import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminCreateUserForm } from "@/features/admin/create-user-form";
import { ResetPasswordButton } from "@/features/admin/reset-password-button";
import { updateUserStatusAction } from "@/server/actions/admin.actions";
import { getAdminUsers } from "@/server/queries/admin";

export default async function AdminGuardsPage() {
  const users = await getAdminUsers();
  const guards = users.filter((user) => user.rol === "GUARDIA");

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <AdminCreateUserForm households={[]} lockedRole="GUARDIA" title="Crear guardia" />

      <Card>
        <CardHeader>
          <CardTitle>Guardias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {guards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aun no hay guardias registrados.</p>
          ) : (
            guards.map((guard) => (
              <div
                key={guard.id}
                className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{guard.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {guard.email} · {guard.estatus}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ResetPasswordButton userId={guard.id} />
                  <form action={updateUserStatusAction}>
                    <input type="hidden" name="id" value={guard.id} />
                    <input
                      type="hidden"
                      name="estatus"
                      value={guard.estatus === "ACTIVO" ? "INACTIVO" : "ACTIVO"}
                    />
                    <Button variant="secondary" size="sm">
                      {guard.estatus === "ACTIVO" ? "Desactivar" : "Activar"}
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
