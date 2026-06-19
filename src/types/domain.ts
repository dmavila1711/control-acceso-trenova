export const USER_ROLES = ["SUPERADMIN", "ADMINISTRACION", "GUARDIA", "COLONO"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVO", "INACTIVO", "SUSPENDIDO"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const FRACTIONATION_STATUSES = [
  "ACTIVO",
  "SUSPENDIDO",
  "EN_CONFIGURACION",
  "INACTIVO"
] as const;
export type FractionationStatus = (typeof FRACTIONATION_STATUSES)[number];

export const HOUSEHOLD_STATUSES = ["ACTIVO", "INACTIVO", "BLOQUEADO_PARA_INVITACIONES"] as const;
export type HouseholdStatus = (typeof HOUSEHOLD_STATUSES)[number];

export const VISIT_TYPES = [
  "VISITA",
  "TRANSPORTE",
  "PAQUETERIA_MENSAJERIA",
  "SERVICIO_PROVEEDOR",
  "OTRO"
] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const AUTHORIZATION_TYPES = ["UN_DIA", "HOY_MANANA", "VISITA_FRECUENTE", "EN_CASETA"] as const;
export type AuthorizationType = (typeof AUTHORIZATION_TYPES)[number];

export const INVITATION_STATUSES = [
  "VIGENTE",
  "USADA",
  "CANCELADA",
  "EXPIRADA",
  "RECHAZADA_EN_CASETA"
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const VALIDATION_METHODS = ["QR", "CODIGO_NUMERICO", "BUSQUEDA_MANUAL", "SIN_INVITACION"] as const;
export type ValidationMethod = (typeof VALIDATION_METHODS)[number];

export const ACCESS_RESULTS = [
  "PERMITIDO",
  "RECHAZADO",
  "INVITACION_EXPIRADA",
  "INVITACION_CANCELADA",
  "INVITACION_NO_ENCONTRADA",
  "DOMICILIO_INACTIVO",
  "FRACCIONAMIENTO_SUSPENDIDO",
  "OTRO"
] as const;
export type AccessResult = (typeof ACCESS_RESULTS)[number];

export const NOTICE_PRIORITIES = ["BAJA", "NORMAL", "ALTA"] as const;
export type NoticePriority = (typeof NOTICE_PRIORITIES)[number];

export const MESSAGE_CHANNELS = ["INTERNO", "EMAIL", "WHATSAPP", "PUSH"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const MESSAGE_STATUSES = ["ENVIADO", "LEIDO", "FALLIDO", "PENDIENTE"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export type UUID = string;

export type CurrentUserProfile = {
  id: UUID;
  auth_user_id: UUID;
  fraccionamiento_id: UUID | null;
  domicilio_id: UUID | null;
  nombre: string;
  email: string;
  rol: UserRole;
  estatus: UserStatus;
};

export type ActionResponse<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type ValidationSuccess = {
  status: "VALIDA";
  invitacionId: UUID;
  domicilioId: UUID;
  visitante: string;
  tipoVisita: VisitType;
  domicilio?: string | null;
  placas?: string | null;
  vigencia: {
    inicio: string;
    fin: string;
  };
};

export type ValidationFailure = {
  status: "INVALIDA";
  resultado: AccessResult;
  message: string;
};

export type InvitationValidationResult = ValidationSuccess | ValidationFailure;
