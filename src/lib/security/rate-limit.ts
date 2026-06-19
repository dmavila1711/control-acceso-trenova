// Lógica pura de rate limiting (sin dependencias server-only) para poder probarla.

export const RATE_LIMIT = {
  guardia: { max: 5, windowSeconds: 60 },
  fraccionamiento: { max: 20, windowSeconds: 600 }
};

// ¿Se excedió algún umbral de intentos fallidos recientes?
export function isRateLimited(guardiaFailures: number, fraccionamientoFailures: number): boolean {
  return (
    guardiaFailures >= RATE_LIMIT.guardia.max ||
    fraccionamientoFailures >= RATE_LIMIT.fraccionamiento.max
  );
}
