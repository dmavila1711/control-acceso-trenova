import type {
  AccessLogRow,
  AdminMessageRow,
  FractionationConfigRow,
  FractionationRow,
  HouseholdRow,
  InvitationRow,
  NoticeRow,
  UserProfileRow
} from "@/types/database";
import type { AccessResult, InvitationStatus, ValidationMethod } from "@/types/domain";

export type CreateFractionationData = {
  nombre: string;
  direccion?: string | null;
  contacto_admin?: string | null;
  email_contacto?: string | null;
};

export type CreateHouseholdData = {
  fraccionamiento_id: string;
  calle: string;
  numero_exterior: string;
  numero_interior?: string | null;
  referencia?: string | null;
};

export type CreateUserData = {
  auth_user_id: string;
  fraccionamiento_id?: string | null;
  domicilio_id?: string | null;
  nombre: string;
  email: string;
  rol: UserProfileRow["rol"];
  estatus?: UserProfileRow["estatus"];
};

export type CreateInvitationData = {
  fraccionamiento_id: string;
  domicilio_id: string;
  created_by: string;
  tipo_visita: InvitationRow["tipo_visita"];
  nombre_visitante: string;
  empresa?: string | null;
  telefono_visitante?: string | null;
  placas?: string | null;
  tipo_autorizacion: InvitationRow["tipo_autorizacion"];
  fecha_inicio: string;
  fecha_fin: string;
  qr_token_hash: string;
  codigo_numerico_hash: string;
  qr_token_ciphertext?: string | null;
  codigo_numerico_ciphertext?: string | null;
  codigo_numerico_last4: string;
  observaciones?: string | null;
};

export type CreateAccessLogData = {
  fraccionamiento_id: string;
  domicilio_id?: string | null;
  invitacion_id?: string | null;
  guardia_id: string;
  nombre_visitante?: string | null;
  tipo_visita?: AccessLogRow["tipo_visita"];
  metodo_validacion: ValidationMethod;
  resultado: AccessResult;
  observaciones?: string | null;
  resolved_at?: string | null;
};

export type CreateNoticeData = {
  fraccionamiento_id: string;
  titulo: string;
  mensaje: string;
  prioridad: NoticeRow["prioridad"];
  fecha_inicio: string;
  fecha_fin: string;
  created_by: string;
};

export type CreateMessageData = {
  fraccionamiento_id: string;
  sender_id: string;
  recipient_id: string;
  titulo: string;
  mensaje: string;
};

export type AdminMetrics = {
  invitacionesHoy: number;
  invitacionesMes: number;
  accesosHoy: number;
  accesosPermitidosHoy: number;
  accesosRechazadosHoy: number;
  usuariosActivos: number;
  domiciliosActivos: number;
  avisosActivos: number;
  validacionesQrHoy: number;
  validacionesCodigoHoy: number;
};

export type SuperadminMetrics = {
  fraccionamientosTotales: number;
  fraccionamientosActivos: number;
  fraccionamientosSuspendidos: number;
  usuariosActivos: number;
  invitacionesHoy: number;
  invitacionesMes: number;
  accesosHoy: number;
  accesosMes: number;
  mensajesInternos: number;
};

export interface FractionationRepository {
  create(data: CreateFractionationData): Promise<FractionationRow>;
  list(): Promise<FractionationRow[]>;
  findById(id: string): Promise<FractionationRow | null>;
  suspend(id: string, actorId: string, reason: string): Promise<FractionationRow>;
  reactivate(id: string): Promise<FractionationRow>;
  getConfig(fraccionamientoId: string): Promise<FractionationConfigRow | null>;
}

export interface HouseholdRepository {
  create(data: CreateHouseholdData): Promise<HouseholdRow>;
  listByFractionation(fraccionamientoId: string): Promise<HouseholdRow[]>;
  findById(id: string): Promise<HouseholdRow | null>;
  updateStatus(id: string, estatus: HouseholdRow["estatus"]): Promise<HouseholdRow>;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<UserProfileRow>;
  findById(id: string): Promise<UserProfileRow | null>;
  listByFractionation(fraccionamientoId: string): Promise<UserProfileRow[]>;
  listByHousehold(domicilioId: string): Promise<UserProfileRow[]>;
  listMessageRecipients(fraccionamientoId: string): Promise<UserProfileRow[]>;
  countActiveColonists(domicilioId: string): Promise<number>;
  updateStatus(id: string, estatus: UserProfileRow["estatus"], actorId: string): Promise<UserProfileRow>;
  updateProfile(id: string, data: { nombre?: string; domicilio_id?: string | null }): Promise<UserProfileRow>;
}

export interface InvitationRepository {
  create(data: CreateInvitationData): Promise<InvitationRow>;
  findById(id: string): Promise<InvitationRow | null>;
  findByQrHash(hash: string, fraccionamientoId: string): Promise<InvitationRow | null>;
  findByNumericHash(hash: string, fraccionamientoId: string): Promise<InvitationRow | null>;
  listByHousehold(domicilioId: string): Promise<InvitationRow[]>;
  listByFractionation(fraccionamientoId: string): Promise<InvitationRow[]>;
  listActiveToday(fraccionamientoId: string): Promise<InvitationRow[]>;
  searchActive(fraccionamientoId: string, query: string): Promise<InvitationRow[]>;
  updateStatus(id: string, estatus: InvitationStatus, actorId?: string | null): Promise<InvitationRow>;
  // Marca como USADA solo si sigue VIGENTE (atómico). Devuelve true si la marcó,
  // false si ya no estaba vigente (p. ej. otro guardia la usó al mismo tiempo).
  markUsedIfVigente(id: string): Promise<boolean>;
  cancel(id: string, actorId: string): Promise<InvitationRow>;
}

export interface AccessLogRepository {
  create(data: CreateAccessLogData): Promise<AccessLogRow>;
  listByHousehold(domicilioId: string): Promise<AccessLogRow[]>;
  listByFractionation(fraccionamientoId: string): Promise<AccessLogRow[]>;
  recentByFractionation(fraccionamientoId: string, limit?: number): Promise<AccessLogRow[]>;
}

export interface NoticeRepository {
  create(data: CreateNoticeData): Promise<NoticeRow>;
  activeByFractionation(fraccionamientoId: string): Promise<NoticeRow[]>;
  listByFractionation(fraccionamientoId: string): Promise<NoticeRow[]>;
}

export interface MessageRepository {
  createMany(data: CreateMessageData[]): Promise<AdminMessageRow[]>;
  listForRecipient(recipientId: string): Promise<AdminMessageRow[]>;
  listByFractionation(fraccionamientoId: string): Promise<AdminMessageRow[]>;
}

export interface MetricsRepository {
  admin(fraccionamientoId: string, timeZone: string): Promise<AdminMetrics>;
  superadmin(timeZone: string): Promise<SuperadminMetrics>;
}

export interface Repositories {
  fractionations: FractionationRepository;
  households: HouseholdRepository;
  users: UserRepository;
  invitations: InvitationRepository;
  accessLogs: AccessLogRepository;
  notices: NoticeRepository;
  messages: MessageRepository;
  metrics: MetricsRepository;
}
