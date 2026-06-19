import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenantReadiness } from "@/server/queries/admin";

const ESTADO_STYLE: Record<TenantReadiness["estado"], { label: string; className: string }> = {
  LISTO: { label: "Listo para operar", className: "bg-emerald-100 text-emerald-800" },
  INCOMPLETO: { label: "Configuracion incompleta", className: "bg-amber-100 text-amber-800" },
  REQUIERE_ATENCION: { label: "Requiere atencion", className: "bg-orange-100 text-orange-800" },
  SUSPENDIDO: { label: "Suspendido", className: "bg-red-100 text-red-800" }
};

export function TenantReadinessPanel({ readiness }: { readiness: TenantReadiness }) {
  const estado = ESTADO_STYLE[readiness.estado];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Puesta en marcha</CardTitle>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.className}`}>{estado.label}</span>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {readiness.items.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-2 rounded-md border p-2.5">
              <span className="flex items-center gap-2 text-sm">
                {item.ok ? (
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <X className="h-4 w-4 text-red-500" aria-hidden="true" />
                )}
                {item.label}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{item.detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
