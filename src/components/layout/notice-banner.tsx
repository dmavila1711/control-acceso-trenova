import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NoticeRow } from "@/types/database";

export function NoticeBanner({ notices }: { notices: NoticeRow[] }) {
  if (notices.length === 0) {
    return null;
  }

  return (
    <section className="mb-5 space-y-2" aria-label="Avisos generales">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className="flex gap-3 rounded-lg border bg-white p-4 shadow-soft"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{notice.titulo}</h2>
              <Badge tone={notice.prioridad === "ALTA" ? "danger" : notice.prioridad === "BAJA" ? "info" : "warning"}>
                {notice.prioridad}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{notice.mensaje}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
