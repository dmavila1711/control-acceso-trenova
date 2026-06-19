import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { registerNotFoundAccessAction } from "@/server/actions/access.actions";
import { searchCasetaInvitations } from "@/server/queries/caseta";
import { formatDateTime } from "@/lib/utils";

export default async function CasetaSearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const results = query ? await searchCasetaInvitations(query) : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Buscar invitacion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="q">Nombre, domicilio o placas</Label>
              <Input id="q" name="q" defaultValue={query} placeholder="Ej. Juan Perez, Roble 42 o ABC123" />
            </div>
            <Button>
              <Search className="h-4 w-4" aria-hidden="true" />
              Buscar
            </Button>
          </form>

          <div className="space-y-3">
            {results.map((invitation) => (
              <Link
                key={invitation.id}
                href={`/caseta/invitacion/${invitation.id}`}
                className="block rounded-md border p-3 hover:bg-secondary/60"
              >
                <p className="font-medium">{invitation.nombre_visitante}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invitation.tipo_visita.replaceAll("_", " ")}
                  {invitation.placas ? ` · Placas ${invitation.placas}` : ""} · Hasta{" "}
                  {formatDateTime(invitation.fecha_fin)}
                </p>
              </Link>
            ))}
            {query && results.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin resultados vigentes.</p>
            ) : null}
            {!query ? (
              <p className="text-sm text-muted-foreground">
                Escribe un dato para buscar invitaciones vigentes.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar intento no encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={registerNotFoundAccessAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="nombre_visitante">Nombre visitante</Label>
              <Input id="nombre_visitante" name="nombre_visitante" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea id="observaciones" name="observaciones" />
            </div>
            <Button variant="secondary" className="w-full">Registrar intento</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
