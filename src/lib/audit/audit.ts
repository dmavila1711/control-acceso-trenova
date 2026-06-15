import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuditRow, Json } from "@/types/database";
import type { CurrentUserProfile } from "@/types/domain";

export type AuditActionInput = {
  actor: CurrentUserProfile | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  fraccionamientoId?: string | null;
  domicilioId?: string | null;
  metadata?: Json | null;
  previousValues?: Json | null;
  newValues?: Json | null;
};

async function requestContext() {
  try {
    const requestHeaders = await headers();
    return {
      userAgent: requestHeaders.get("user-agent"),
      ipAddress:
        requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        requestHeaders.get("x-real-ip")
    };
  } catch {
    return {
      userAgent: null,
      ipAddress: null
    };
  }
}

export async function auditAction(input: AuditActionInput) {
  const supabase = await createSupabaseServerClient();
  const context = await requestContext();

  const payload: Omit<AuditRow, "id" | "created_at"> = {
    fraccionamiento_id: input.fraccionamientoId ?? input.actor?.fraccionamiento_id ?? null,
    actor_user_id: input.actor?.id ?? null,
    actor_role: input.actor?.rol ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    domicilio_id: input.domicilioId ?? null,
    metadata: input.metadata ?? null,
    previous_values: input.previousValues ?? null,
    new_values: input.newValues ?? null,
    ip_address: context.ipAddress,
    user_agent: context.userAgent
  };

  const { error } = await supabase.from("auditoria").insert(payload);
  if (error) {
    console.error("No se pudo registrar auditoria", error.message);
  }
}
