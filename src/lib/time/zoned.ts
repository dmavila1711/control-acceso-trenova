// Utilidades de fecha con zona horaria. Los limites de dia/mes deben calcularse
// en la zona del fraccionamiento, no en la del servidor (UTC en Vercel). De lo
// contrario una invitacion de "un dia" expiraria a media tarde hora local.

const DEFAULT_TIME_ZONE = "America/Mexico_City";

export function resolveTimeZone(override?: string | null): string {
  const candidate = override?.trim() || process.env.APP_TIMEZONE?.trim() || DEFAULT_TIME_ZONE;
  try {
    // Lanza RangeError si la zona no es valida (IANA).
    new Intl.DateTimeFormat("en-US", { timeZone: candidate });
    return candidate;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

// Offset (ms) de la zona respecto a UTC en el instante dado.
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  // Comparamos contra el instante truncado al segundo: formatToParts no incluye
  // milisegundos, asi que sin truncar la fraccion de segundo contaminaria el offset.
  const instantSeconds = Math.floor(instant.getTime() / 1000) * 1000;
  return asUtc - instantSeconds;
}

// Convierte una hora de pared (en timeZone) al instante UTC correspondiente.
// El ajuste en dos pasos cubre las transiciones de horario de verano.
function wallTimeToInstant(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  ms: number,
  timeZone: string
): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s, ms);
  const offset = zoneOffsetMs(new Date(guess), timeZone);
  const adjusted = guess - offset;
  const offset2 = zoneOffsetMs(new Date(adjusted), timeZone);
  return new Date(guess - offset2);
}

// Ano/mes/dia de pared del instante dado en la zona indicada.
function zonedYMD(instant: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { y: get("year"), mo: get("month"), d: get("day") };
}

export function zonedStartOfDay(timeZone: string, ref: Date = new Date()): Date {
  const { y, mo, d } = zonedYMD(ref, timeZone);
  return wallTimeToInstant(y, mo, d, 0, 0, 0, 0, timeZone);
}

export function zonedEndOfDay(timeZone: string, ref: Date = new Date()): Date {
  const { y, mo, d } = zonedYMD(ref, timeZone);
  return wallTimeToInstant(y, mo, d, 23, 59, 59, 999, timeZone);
}

export function zonedStartOfMonth(timeZone: string, ref: Date = new Date()): Date {
  const { y, mo } = zonedYMD(ref, timeZone);
  return wallTimeToInstant(y, mo, 1, 0, 0, 0, 0, timeZone);
}

// Fin del dia que resulta de sumar `days` al dia de pared de `ref`.
// Date.UTC normaliza el desbordamiento de dia/mes automaticamente.
export function zonedEndOfDayPlusDays(timeZone: string, days: number, ref: Date = new Date()): Date {
  const { y, mo, d } = zonedYMD(ref, timeZone);
  return wallTimeToInstant(y, mo, d + days, 23, 59, 59, 999, timeZone);
}

// Inicio y fin de un dia dado como "YYYY-MM-DD", interpretado en la zona.
export function zonedDayBounds(dateStr: string, timeZone: string): { start: Date; end: Date } {
  const [y, mo, d] = dateStr.split("-").map((part) => Number(part));
  return {
    start: wallTimeToInstant(y, mo, d, 0, 0, 0, 0, timeZone),
    end: wallTimeToInstant(y, mo, d, 23, 59, 59, 999, timeZone)
  };
}
