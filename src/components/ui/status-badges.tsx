import { Badge } from "@/components/ui/badge";
import type { AccessResult, InvitationStatus } from "@/types/domain";

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const tone =
    status === "VIGENTE"
      ? "success"
      : status === "CANCELADA" || status === "RECHAZADA_EN_CASETA"
        ? "danger"
        : status === "EXPIRADA"
          ? "warning"
          : "info";

  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

export function AccessStatusBadge({ result }: { result: AccessResult }) {
  const tone = result === "PERMITIDO" ? "success" : result === "RECHAZADO" ? "danger" : "warning";
  return <Badge tone={tone}>{result.replaceAll("_", " ")}</Badge>;
}
