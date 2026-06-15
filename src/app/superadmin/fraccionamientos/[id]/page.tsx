import { notFound } from "next/navigation";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperadminFractionationDetail } from "@/server/queries/superadmin";

export default async function SuperadminFractionationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getSuperadminFractionationDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{detail.fractionation.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p><span className="text-muted-foreground">Estatus:</span> {detail.fractionation.estatus}</p>
          <p><span className="text-muted-foreground">Direccion:</span> {detail.fractionation.direccion ?? "Sin direccion"}</p>
          <p><span className="text-muted-foreground">Contacto:</span> {detail.fractionation.contacto_admin ?? "Sin contacto"}</p>
          <p><span className="text-muted-foreground">Email:</span> {detail.fractionation.email_contacto ?? "Sin email"}</p>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardCard label="Usuarios" value={detail.users.length} />
        <DashboardCard label="Domicilios" value={detail.households.length} />
        <DashboardCard label="Invitaciones" value={detail.invitations.length} />
        <DashboardCard label="Accesos" value={detail.accessLogs.length} />
        <DashboardCard label="Mensajes" value={detail.messages.length} />
      </section>
    </div>
  );
}
