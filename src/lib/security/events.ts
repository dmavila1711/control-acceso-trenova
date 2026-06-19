import "server-only";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RATE_LIMIT, isRateLimited } from "@/lib/security/rate-limit";
import type { Json } from "@/types/database";

export { RATE_LIMIT, isRateLimited };

export const SECURITY_EVENT = {
  RATE_LIMIT_CODE: "RATE_LIMIT_CODE",
  RATE_LIMIT_QR: "RATE_LIMIT_QR",
  INVALID_CODE_ATTEMPT: "INVALID_CODE_ATTEMPT",
  INVALID_QR_ATTEMPT: "INVALID_QR_ATTEMPT",
  ACCESS_DENIED: "ACCESS_DENIED",
  CROSS_TENANT_ATTEMPT: "CROSS_TENANT_ATTEMPT",
  SUSPENDED_FRACTIONATION_ATTEMPT: "SUSPENDED_FRACTIONATION_ATTEMPT"
} as const;

export type SecurityEventType = (typeof SECURITY_EVENT)[keyof typeof SECURITY_EVENT];

const FAILURE_TYPES: SecurityEventType[] = [
  SECURITY_EVENT.INVALID_CODE_ATTEMPT,
  SECURITY_EVENT.INVALID_QR_ATTEMPT
];

type LogInput = {
  fraccionamientoId: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  eventType: SecurityEventType;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json | null;
};

async function requestContext() {
  try {
    const h = await headers();
    return {
      userAgent: h.get("user-agent"),
      ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")
    };
  } catch {
    return { userAgent: null, ipAddress: null };
  }
}

export async function logSecurityEvent(input: LogInput): Promise<void> {
  const admin = createSupabaseAdminClient();
  const ctx = await requestContext();
  const { error } = await admin.from("eventos_seguridad").insert({
    fraccionamiento_id: input.fraccionamientoId,
    actor_user_id: input.actorUserId ?? null,
    actor_role: input.actorRole ?? null,
    event_type: input.eventType,
    severity: input.severity ?? "INFO",
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent
  });
  if (error) {
    // No interrumpimos la operación por un fallo de registro de seguridad.
    console.error("No se pudo registrar evento de seguridad", error.message);
  }
}

// Cuenta intentos fallidos recientes por guardia y por fraccionamiento.
export async function countRecentFailures(params: {
  fraccionamientoId: string;
  actorUserId: string;
}): Promise<{ guardia: number; fraccionamiento: number }> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const sinceGuardia = new Date(now - RATE_LIMIT.guardia.windowSeconds * 1000).toISOString();
  const sinceFracc = new Date(now - RATE_LIMIT.fraccionamiento.windowSeconds * 1000).toISOString();

  const [guardia, fraccionamiento] = await Promise.all([
    admin
      .from("eventos_seguridad")
      .select("*", { count: "exact", head: true })
      .eq("fraccionamiento_id", params.fraccionamientoId)
      .eq("actor_user_id", params.actorUserId)
      .in("event_type", FAILURE_TYPES)
      .gte("created_at", sinceGuardia),
    admin
      .from("eventos_seguridad")
      .select("*", { count: "exact", head: true })
      .eq("fraccionamiento_id", params.fraccionamientoId)
      .in("event_type", FAILURE_TYPES)
      .gte("created_at", sinceFracc)
  ]);

  return {
    guardia: guardia.count ?? 0,
    fraccionamiento: fraccionamiento.count ?? 0
  };
}
