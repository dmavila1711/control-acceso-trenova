import type {
  AccessResult,
  AuthorizationType,
  FractionationStatus,
  HouseholdStatus,
  InvitationStatus,
  MessageChannel,
  MessageStatus,
  NoticePriority,
  UserRole,
  UserStatus,
  ValidationMethod,
  VisitType
} from "@/types/domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: [];
};

type GenericTableForSchema = TableDef<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
type GenericViewForSchema = {
  Row: Record<string, unknown>;
  Relationships: [];
};
type GenericFunctionForSchema = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export type FractionationRow = {
  id: string;
  nombre: string;
  direccion: string | null;
  contacto_admin: string | null;
  email_contacto: string | null;
  estatus: FractionationStatus;
  created_at: string;
  updated_at: string;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: string | null;
};

export type HouseholdRow = {
  id: string;
  fraccionamiento_id: string;
  calle: string;
  numero_exterior: string;
  numero_interior: string | null;
  referencia: string | null;
  estatus: HouseholdStatus;
  created_at: string;
  updated_at: string;
};

export type UserProfileRow = {
  id: string;
  auth_user_id: string;
  fraccionamiento_id: string | null;
  domicilio_id: string | null;
  nombre: string;
  email: string;
  rol: UserRole;
  estatus: UserStatus;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
  deactivated_by: string | null;
};

export type InvitationRow = {
  id: string;
  fraccionamiento_id: string;
  domicilio_id: string;
  created_by: string;
  tipo_visita: VisitType;
  nombre_visitante: string;
  empresa: string | null;
  telefono_visitante: string | null;
  placas: string | null;
  tipo_autorizacion: AuthorizationType;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: InvitationStatus;
  qr_token_hash: string;
  codigo_numerico_hash: string;
  qr_token_ciphertext: string | null;
  codigo_numerico_ciphertext: string | null;
  codigo_numerico_last4: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
};

export type AccessLogRow = {
  id: string;
  fraccionamiento_id: string;
  domicilio_id: string | null;
  invitacion_id: string | null;
  guardia_id: string;
  nombre_visitante: string | null;
  tipo_visita: VisitType | null;
  metodo_validacion: ValidationMethod;
  resultado: AccessResult;
  observaciones: string | null;
  arrived_at: string;
  resolved_at: string | null;
  created_at: string;
};

export type NoticeRow = {
  id: string;
  fraccionamiento_id: string;
  titulo: string;
  mensaje: string;
  prioridad: NoticePriority;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: "ACTIVO" | "INACTIVO";
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AdminMessageRow = {
  id: string;
  fraccionamiento_id: string;
  sender_id: string;
  recipient_id: string;
  titulo: string;
  mensaje: string;
  canal: MessageChannel;
  estatus: MessageStatus;
  read_at: string | null;
  created_at: string;
};

export type AuditRow = {
  id: string;
  fraccionamiento_id: string | null;
  actor_user_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  domicilio_id: string | null;
  metadata: Json | null;
  previous_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type FractionationConfigRow = {
  id: string;
  fraccionamiento_id: string;
  max_usuarios_por_domicilio: number;
  permite_compartir_whatsapp: boolean;
  requiere_email_usuario: boolean;
  zona_horaria: string;
  created_at: string;
  updated_at: string;
};

export type MessageEventRow = {
  id: string;
  fraccionamiento_id: string | null;
  mensaje_id: string | null;
  canal: MessageChannel;
  evento: string;
  estatus: string;
  metadata: Json | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      fraccionamientos: TableDef<
        FractionationRow,
        Partial<Pick<FractionationRow, "id" | "created_at" | "updated_at">> &
          Pick<FractionationRow, "nombre"> &
          Partial<Omit<FractionationRow, "id" | "nombre" | "created_at" | "updated_at">>
      >;
      domicilios: TableDef<
        HouseholdRow,
        Partial<Pick<HouseholdRow, "id" | "created_at" | "updated_at">> &
          Pick<HouseholdRow, "fraccionamiento_id" | "calle" | "numero_exterior"> &
          Partial<Omit<HouseholdRow, "id" | "fraccionamiento_id" | "calle" | "numero_exterior" | "created_at" | "updated_at">>
      >;
      perfiles_usuario: TableDef<
        UserProfileRow,
        Partial<Pick<UserProfileRow, "id" | "created_at" | "updated_at" | "deactivated_at" | "deactivated_by">> &
          Pick<UserProfileRow, "auth_user_id" | "nombre" | "email" | "rol"> &
          Partial<Omit<UserProfileRow, "id" | "auth_user_id" | "nombre" | "email" | "rol" | "created_at" | "updated_at">>
      >;
      invitaciones: TableDef<
        InvitationRow,
        Partial<Pick<InvitationRow, "id" | "created_at" | "updated_at" | "cancelled_at" | "cancelled_by">> &
          Pick<
            InvitationRow,
            | "fraccionamiento_id"
            | "domicilio_id"
            | "created_by"
            | "tipo_visita"
            | "nombre_visitante"
            | "tipo_autorizacion"
            | "fecha_inicio"
            | "fecha_fin"
            | "qr_token_hash"
            | "codigo_numerico_hash"
          > &
          Partial<
            Omit<
              InvitationRow,
              | "id"
              | "fraccionamiento_id"
              | "domicilio_id"
              | "created_by"
              | "tipo_visita"
              | "nombre_visitante"
              | "tipo_autorizacion"
              | "fecha_inicio"
              | "fecha_fin"
              | "qr_token_hash"
              | "codigo_numerico_hash"
              | "created_at"
              | "updated_at"
            >
          >
      >;
      accesos: TableDef<
        AccessLogRow,
        Partial<Pick<AccessLogRow, "id" | "arrived_at" | "resolved_at" | "created_at">> &
          Pick<AccessLogRow, "fraccionamiento_id" | "guardia_id" | "metodo_validacion" | "resultado"> &
          Partial<Omit<AccessLogRow, "id" | "fraccionamiento_id" | "guardia_id" | "metodo_validacion" | "resultado" | "created_at">>
      >;
      avisos_generales: TableDef<
        NoticeRow,
        Partial<Pick<NoticeRow, "id" | "created_at" | "updated_at">> &
          Pick<NoticeRow, "fraccionamiento_id" | "titulo" | "mensaje" | "fecha_inicio" | "fecha_fin" | "created_by"> &
          Partial<Omit<NoticeRow, "id" | "fraccionamiento_id" | "titulo" | "mensaje" | "fecha_inicio" | "fecha_fin" | "created_by" | "created_at" | "updated_at">>
      >;
      mensajes_administrativos: TableDef<
        AdminMessageRow,
        Partial<Pick<AdminMessageRow, "id" | "canal" | "estatus" | "read_at" | "created_at">> &
          Pick<AdminMessageRow, "fraccionamiento_id" | "sender_id" | "recipient_id" | "titulo" | "mensaje">
      >;
      auditoria: TableDef<
        AuditRow,
        Partial<Pick<AuditRow, "id" | "created_at">> & Omit<AuditRow, "id" | "created_at">
      >;
      configuracion_fraccionamiento: TableDef<
        FractionationConfigRow,
        Partial<Pick<FractionationConfigRow, "id" | "created_at" | "updated_at">> &
          Pick<FractionationConfigRow, "fraccionamiento_id"> &
          Partial<Omit<FractionationConfigRow, "id" | "fraccionamiento_id" | "created_at" | "updated_at">>
      >;
      eventos_mensaje: TableDef<
        MessageEventRow,
        Partial<Pick<MessageEventRow, "id" | "created_at">> &
          Pick<MessageEventRow, "canal" | "evento" | "estatus"> &
          Partial<Omit<MessageEventRow, "id" | "canal" | "evento" | "estatus" | "created_at">>
      >;
    } & Record<string, GenericTableForSchema>;
    Views: Record<string, GenericViewForSchema>;
    Functions: Record<string, GenericFunctionForSchema>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
