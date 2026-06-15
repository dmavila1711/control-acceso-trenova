import { AppError } from "@/lib/errors";
import { zonedStartOfDay, zonedStartOfMonth } from "@/lib/time/zoned";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import type {
  AccessLogRepository,
  CreateAccessLogData,
  CreateFractionationData,
  CreateHouseholdData,
  CreateInvitationData,
  CreateMessageData,
  CreateNoticeData,
  CreateUserData,
  FractionationRepository,
  HouseholdRepository,
  InvitationRepository,
  MessageRepository,
  MetricsRepository,
  NoticeRepository,
  Repositories,
  UserRepository
} from "@/lib/repositories/contracts";
import type { InvitationStatus } from "@/types/domain";

function raise(message: string): never {
  throw new AppError(message);
}

async function exactCount(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
) {
  const { count, error } = await query;
  if (error) {
    raise(error.message);
  }
  return count ?? 0;
}

class SupabaseFractionationRepository implements FractionationRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async create(data: CreateFractionationData) {
    const { data: row, error } = await this.supabase
      .from("fraccionamientos")
      .insert(data)
      .select("*")
      .single();
    if (error) raise(error.message);
    return row;
  }

  async list() {
    const { data, error } = await this.supabase
      .from("fraccionamientos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("fraccionamientos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) raise(error.message);
    return data;
  }

  async suspend(id: string, actorId: string, reason: string) {
    const { data, error } = await this.supabase
      .from("fraccionamientos")
      .update({
        estatus: "SUSPENDIDO",
        suspended_at: new Date().toISOString(),
        suspended_by: actorId,
        suspension_reason: reason
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) raise(error.message);
    return data;
  }

  async reactivate(id: string) {
    const { data, error } = await this.supabase
      .from("fraccionamientos")
      .update({
        estatus: "ACTIVO",
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) raise(error.message);
    return data;
  }

  async getConfig(fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("configuracion_fraccionamiento")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .maybeSingle();
    if (error) raise(error.message);
    return data;
  }
}

class SupabaseHouseholdRepository implements HouseholdRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async create(data: CreateHouseholdData) {
    const { data: row, error } = await this.supabase.from("domicilios").insert(data).select("*").single();
    if (error) raise(error.message);
    return row;
  }

  async listByFractionation(fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("domicilios")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .order("calle");
    if (error) raise(error.message);
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.from("domicilios").select("*").eq("id", id).maybeSingle();
    if (error) raise(error.message);
    return data;
  }

  async updateStatus(id: string, estatus: "ACTIVO" | "INACTIVO") {
    const { data, error } = await this.supabase
      .from("domicilios")
      .update({ estatus })
      .eq("id", id)
      .select("*")
      .single();
    if (error) raise(error.message);
    return data;
  }
}

class SupabaseUserRepository implements UserRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async create(data: CreateUserData) {
    const { data: row, error } = await this.supabase
      .from("perfiles_usuario")
      .insert(data)
      .select("*")
      .single();
    if (error) raise(error.message);
    return row;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.from("perfiles_usuario").select("*").eq("id", id).maybeSingle();
    if (error) raise(error.message);
    return data;
  }

  async listByFractionation(fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("perfiles_usuario")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .order("created_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }

  async listMessageRecipients(fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("perfiles_usuario")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .eq("estatus", "ACTIVO")
      .order("nombre");
    if (error) raise(error.message);
    return data;
  }

  async countActiveColonists(domicilioId: string) {
    return exactCount(
      this.supabase
        .from("perfiles_usuario")
        .select("*", { count: "exact", head: true })
        .eq("domicilio_id", domicilioId)
        .eq("rol", "COLONO")
        .eq("estatus", "ACTIVO")
    );
  }

  async updateStatus(id: string, estatus: "ACTIVO" | "INACTIVO" | "SUSPENDIDO", actorId: string) {
    const { data, error } = await this.supabase
      .from("perfiles_usuario")
      .update({
        estatus,
        deactivated_at: estatus === "ACTIVO" ? null : new Date().toISOString(),
        deactivated_by: estatus === "ACTIVO" ? null : actorId
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) raise(error.message);
    return data;
  }
}

class SupabaseInvitationRepository implements InvitationRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async create(data: CreateInvitationData) {
    const { data: row, error } = await this.supabase.from("invitaciones").insert(data).select("*").single();
    if (error) raise(error.message);
    return row;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.from("invitaciones").select("*").eq("id", id).maybeSingle();
    if (error) raise(error.message);
    return data;
  }

  async findByQrHash(hash: string, fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("invitaciones")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .eq("qr_token_hash", hash)
      .maybeSingle();
    if (error) raise(error.message);
    return data;
  }

  async findByNumericHash(hash: string, fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("invitaciones")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .eq("codigo_numerico_hash", hash)
      .maybeSingle();
    if (error) raise(error.message);
    return data;
  }

  async listByHousehold(domicilioId: string) {
    const { data, error } = await this.supabase
      .from("invitaciones")
      .select("*")
      .eq("domicilio_id", domicilioId)
      .order("created_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }

  async listByFractionation(fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("invitaciones")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .order("created_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }

  async listActiveToday(fraccionamientoId: string) {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("invitaciones")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .eq("estatus", "VIGENTE")
      .lte("fecha_inicio", now)
      .gte("fecha_fin", now)
      .order("fecha_fin");
    if (error) raise(error.message);
    return data;
  }

  async searchActive(fraccionamientoId: string, query: string) {
    const now = new Date().toISOString();
    // Las comas y parentesis rompen la sintaxis de .or() de PostgREST.
    const term = query.replace(/[(),]/g, " ").trim();
    if (!term) {
      return [];
    }

    // Domicilios que coinciden por calle o numero exterior, para buscar tambien
    // por domicilio y no solo por nombre del visitante.
    const { data: households, error: householdError } = await this.supabase
      .from("domicilios")
      .select("id")
      .eq("fraccionamiento_id", fraccionamientoId)
      .or(`calle.ilike.%${term}%,numero_exterior.ilike.%${term}%`);
    if (householdError) raise(householdError.message);
    const householdIds = (households ?? []).map((row) => row.id);

    const base = this.supabase
      .from("invitaciones")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .eq("estatus", "VIGENTE")
      .lte("fecha_inicio", now)
      .gte("fecha_fin", now);

    const { data, error } =
      householdIds.length > 0
        ? await base
            .or(`nombre_visitante.ilike.%${term}%,domicilio_id.in.(${householdIds.join(",")})`)
            .limit(20)
        : await base.ilike("nombre_visitante", `%${term}%`).limit(20);
    if (error) raise(error.message);
    return data;
  }

  async updateStatus(id: string, estatus: InvitationStatus, actorId?: string | null) {
    const { data, error } = await this.supabase
      .from("invitaciones")
      .update({
        estatus,
        cancelled_at: estatus === "CANCELADA" ? new Date().toISOString() : undefined,
        cancelled_by: estatus === "CANCELADA" ? actorId ?? null : undefined
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) raise(error.message);
    return data;
  }

  async cancel(id: string, actorId: string) {
    return this.updateStatus(id, "CANCELADA", actorId);
  }
}

class SupabaseAccessLogRepository implements AccessLogRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async create(data: CreateAccessLogData) {
    const { data: row, error } = await this.supabase.from("accesos").insert(data).select("*").single();
    if (error) raise(error.message);
    return row;
  }

  async listByHousehold(domicilioId: string) {
    const { data, error } = await this.supabase
      .from("accesos")
      .select("*")
      .eq("domicilio_id", domicilioId)
      .order("arrived_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }

  async listByFractionation(fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("accesos")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .order("arrived_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }

  async recentByFractionation(fraccionamientoId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from("accesos")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .order("arrived_at", { ascending: false })
      .limit(limit);
    if (error) raise(error.message);
    return data;
  }
}

class SupabaseNoticeRepository implements NoticeRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async create(data: CreateNoticeData) {
    const { data: row, error } = await this.supabase.from("avisos_generales").insert(data).select("*").single();
    if (error) raise(error.message);
    return row;
  }

  async activeByFractionation(fraccionamientoId: string) {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("avisos_generales")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .eq("estatus", "ACTIVO")
      .lte("fecha_inicio", now)
      .gte("fecha_fin", now)
      .order("fecha_inicio", { ascending: false });
    if (error) raise(error.message);
    // Ordenamos por prioridad real (ALTA > NORMAL > BAJA); el orden alfabetico
    // de texto dejaria los avisos ALTA al final.
    const peso: Record<string, number> = { ALTA: 0, NORMAL: 1, BAJA: 2 };
    return [...data].sort((a, b) => (peso[a.prioridad] ?? 1) - (peso[b.prioridad] ?? 1));
  }

  async listByFractionation(fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("avisos_generales")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .order("created_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }
}

class SupabaseMessageRepository implements MessageRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async createMany(data: CreateMessageData[]) {
    if (data.length === 0) {
      return [];
    }

    const { data: rows, error } = await this.supabase
      .from("mensajes_administrativos")
      .insert(data)
      .select("*");
    if (error) raise(error.message);
    return rows;
  }

  async listForRecipient(recipientId: string) {
    const { data, error } = await this.supabase
      .from("mensajes_administrativos")
      .select("*")
      .eq("recipient_id", recipientId)
      .order("created_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }

  async listByFractionation(fraccionamientoId: string) {
    const { data, error } = await this.supabase
      .from("mensajes_administrativos")
      .select("*")
      .eq("fraccionamiento_id", fraccionamientoId)
      .order("created_at", { ascending: false });
    if (error) raise(error.message);
    return data;
  }
}

class SupabaseMetricsRepository implements MetricsRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async admin(fraccionamientoId: string, timeZone: string) {
    const today = zonedStartOfDay(timeZone).toISOString();
    const month = zonedStartOfMonth(timeZone).toISOString();
    const now = new Date().toISOString();

    const [
      invitacionesHoy,
      invitacionesMes,
      accesosHoy,
      accesosPermitidosHoy,
      accesosRechazadosHoy,
      usuariosActivos,
      domiciliosActivos,
      avisosActivos,
      validacionesQrHoy,
      validacionesCodigoHoy
    ] = await Promise.all([
      exactCount(this.supabase.from("invitaciones").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).gte("created_at", today)),
      exactCount(this.supabase.from("invitaciones").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).gte("created_at", month)),
      exactCount(this.supabase.from("accesos").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).gte("arrived_at", today)),
      exactCount(this.supabase.from("accesos").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).eq("resultado", "PERMITIDO").gte("arrived_at", today)),
      exactCount(this.supabase.from("accesos").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).eq("resultado", "RECHAZADO").gte("arrived_at", today)),
      exactCount(this.supabase.from("perfiles_usuario").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).eq("estatus", "ACTIVO")),
      exactCount(this.supabase.from("domicilios").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).eq("estatus", "ACTIVO")),
      exactCount(this.supabase.from("avisos_generales").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).eq("estatus", "ACTIVO").lte("fecha_inicio", now).gte("fecha_fin", now)),
      exactCount(this.supabase.from("accesos").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).eq("metodo_validacion", "QR").gte("arrived_at", today)),
      exactCount(this.supabase.from("accesos").select("*", { count: "exact", head: true }).eq("fraccionamiento_id", fraccionamientoId).eq("metodo_validacion", "CODIGO_NUMERICO").gte("arrived_at", today))
    ]);

    return {
      invitacionesHoy,
      invitacionesMes,
      accesosHoy,
      accesosPermitidosHoy,
      accesosRechazadosHoy,
      usuariosActivos,
      domiciliosActivos,
      avisosActivos,
      validacionesQrHoy,
      validacionesCodigoHoy
    };
  }

  async superadmin(timeZone: string) {
    const today = zonedStartOfDay(timeZone).toISOString();
    const month = zonedStartOfMonth(timeZone).toISOString();

    const [
      fraccionamientosTotales,
      fraccionamientosActivos,
      fraccionamientosSuspendidos,
      usuariosActivos,
      invitacionesHoy,
      invitacionesMes,
      accesosHoy,
      accesosMes,
      mensajesInternos
    ] = await Promise.all([
      exactCount(this.supabase.from("fraccionamientos").select("*", { count: "exact", head: true })),
      exactCount(this.supabase.from("fraccionamientos").select("*", { count: "exact", head: true }).eq("estatus", "ACTIVO")),
      exactCount(this.supabase.from("fraccionamientos").select("*", { count: "exact", head: true }).eq("estatus", "SUSPENDIDO")),
      exactCount(this.supabase.from("perfiles_usuario").select("*", { count: "exact", head: true }).eq("estatus", "ACTIVO")),
      exactCount(this.supabase.from("invitaciones").select("*", { count: "exact", head: true }).gte("created_at", today)),
      exactCount(this.supabase.from("invitaciones").select("*", { count: "exact", head: true }).gte("created_at", month)),
      exactCount(this.supabase.from("accesos").select("*", { count: "exact", head: true }).gte("arrived_at", today)),
      exactCount(this.supabase.from("accesos").select("*", { count: "exact", head: true }).gte("arrived_at", month)),
      exactCount(this.supabase.from("mensajes_administrativos").select("*", { count: "exact", head: true }).eq("canal", "INTERNO"))
    ]);

    return {
      fraccionamientosTotales,
      fraccionamientosActivos,
      fraccionamientosSuspendidos,
      usuariosActivos,
      invitacionesHoy,
      invitacionesMes,
      accesosHoy,
      accesosMes,
      mensajesInternos
    };
  }
}

export function createRepositories(supabase: AppSupabaseClient): Repositories {
  return {
    fractionations: new SupabaseFractionationRepository(supabase),
    households: new SupabaseHouseholdRepository(supabase),
    users: new SupabaseUserRepository(supabase),
    invitations: new SupabaseInvitationRepository(supabase),
    accessLogs: new SupabaseAccessLogRepository(supabase),
    notices: new SupabaseNoticeRepository(supabase),
    messages: new SupabaseMessageRepository(supabase),
    metrics: new SupabaseMetricsRepository(supabase)
  };
}
