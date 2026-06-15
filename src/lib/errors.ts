export class AppError extends Error {
  constructor(
    message: string,
    public readonly code = "APP_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Necesitas iniciar sesion para continuar.") {
    super(message, "AUTH_ERROR");
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tienes permisos para realizar esta accion.") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "La informacion enviada no es valida.") {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error inesperado.";
}
