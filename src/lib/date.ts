// src/lib/date.ts

export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convierte cualquier Date a YYYY-MM-DD en horario LOCAL
 */
export function toLocalDateString(date: Date, timeZone?: string) {
  const tz = timeZone || getUserTimeZone();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Normaliza una fecha a "mediodía local"
 * Evita problemas de cambio de día por UTC
 */
export const normalizeToLocalMidday = (
  input: string | Date,
  timeZone = "UTC"
): Date => {
  let year: number;
  let month: number;
  let day: number;

  if (typeof input === "string") {
    // input: "YYYY-MM-DD"
    const [y, m, d] = input.split("-").map(Number);
    year = y;
    month = m - 1; // JS months 0-based
    day = d;
  } else {
    // Convert Date → parts in target timezone
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(input);

    year = Number(parts.find(p => p.type === "year")?.value);
    month = Number(parts.find(p => p.type === "month")?.value) - 1;
    day = Number(parts.find(p => p.type === "day")?.value);
  }

  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
};

/**
 * Inicio del día local
 */
export const startOfLocalDay = (date: Date, timeZone = "UTC"): Date => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value) - 1;
  const day = Number(parts.find(p => p.type === "day")?.value);

  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
};

/**
 * Fin del día local
 */
export const endOfLocalDay = (date: Date, timeZone = "UTC"): Date => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value) - 1;
  const day = Number(parts.find(p => p.type === "day")?.value);

  return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
};

/**
 * Obtiene fecha local desplazada N días
 */
export const addDaysLocal = (
  date: Date,
  days: number,
  timeZone = "UTC"
): Date => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value) - 1;
  const day = Number(parts.find(p => p.type === "day")?.value);

  return new Date(Date.UTC(year, month, day + days, 12, 0, 0, 0));
};

/**
 * Comparar si dos fechas son el mismo día local
 */
export const isSameLocalDay = (a: Date, b: Date): boolean => {
  return toLocalDateString(a) === toLocalDateString(b);
};

export const getToday = () => toLocalDateString(new Date());

export const getWeekdayLabel = (date: Date, timeZone?: string) => {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    timeZone: timeZone || getUserTimeZone(),
  })
    .format(date)
    .replace(".", "")
    .slice(0, 1)
    .toUpperCase();
};