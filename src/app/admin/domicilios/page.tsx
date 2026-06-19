import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImportHouseholdsForm } from "@/features/admin/import-households-form";
import { createHouseholdAction, updateHouseholdStatusAction } from "@/server/actions/admin.actions";
import { getAdminHouseholds } from "@/server/queries/admin";
import { compactAddress } from "@/lib/utils";

export default async function AdminHouseholdsPage() {
  const households = await getAdminHouseholds();

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Crear domicilio</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createHouseholdAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="calle">Calle</Label>
                <Input id="calle" name="calle" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="numero_exterior">Exterior</Label>
                  <Input id="numero_exterior" name="numero_exterior" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_interior">Interior</Label>
                  <Input id="numero_interior" name="numero_interior" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referencia">Referencia</Label>
                <Textarea id="referencia" name="referencia" />
              </div>
              <Button className="w-full">Crear domicilio</Button>
            </form>
          </CardContent>
        </Card>

        <ImportHouseholdsForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domicilios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {households.map((household) => (
            <div key={household.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{compactAddress(household)}</p>
                <p className="text-sm text-muted-foreground">{household.estatus}</p>
              </div>
              <form action={updateHouseholdStatusAction}>
                <input type="hidden" name="id" value={household.id} />
                <input type="hidden" name="estatus" value={household.estatus === "ACTIVO" ? "INACTIVO" : "ACTIVO"} />
                <Button variant="secondary" size="sm">{household.estatus === "ACTIVO" ? "Inactivar" : "Activar"}</Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
