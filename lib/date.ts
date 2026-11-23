// Datas como texto YYYY-MM-DD (dia local em São Paulo) e horários HH:MM.
export const TZ = "America/Sao_Paulo";

const fmtDay = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtTime = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Dia de hoje (YYYY-MM-DD) em America/Sao_Paulo; o dia vira às 00h. */
export function today(now: Date = new Date()): string {
  return fmtDay.format(now);
}

/** Hora atual (HH:MM) em America/Sao_Paulo. */
export function nowTime(now: Date = new Date()): string {
  return fmtTime.format(now);
}

export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
export const isTime = (s: unknown): s is string => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

const toUtc = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(d: string, n: number): string {
  return fromUtc(toUtc(d) + n * 86400000);
}

export function diffDays(a: string, b: string): number {
  return Math.round((toUtc(a) - toUtc(b)) / 86400000);
}

/** 0 = domingo ... 6 = sábado. */
export function weekday(d: string): number {
  return new Date(toUtc(d)).getUTCDay();
}

export function dayOfMonth(d: string): number {
  return Number(d.slice(8, 10));
}

export function daysInMonth(d: string): number {
  const [y, m] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Lista de datas de `from` até `to`, inclusive. */
export function range(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function startOfWeek(d: string): string {
  return addDays(d, -weekday(d));
}

const WEEKDAYS_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const weekdayLong = (d: string) => WEEKDAYS_LONG[weekday(d)];
export const weekdayShort = (d: string) => WEEKDAYS_SHORT[weekday(d)];
export const weekdayName = (i: number) => WEEKDAYS_LONG[i];

/** "segunda-feira, 12 de maio" */
export function formatLong(d: string): string {
  return `${weekdayLong(d)}, ${dayOfMonth(d)} de ${MONTHS[Number(d.slice(5, 7)) - 1]}`;
}

/** "12 mai" */
export function formatShort(d: string): string {
  return `${dayOfMonth(d)} ${MONTHS[Number(d.slice(5, 7)) - 1].slice(0, 3)}`;
}

/** "Hoje", "Amanhã", "Ontem" ou "seg, 12 mai". */
export function formatRelative(d: string, ref: string = today()): string {
  const diff = diffDays(d, ref);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  return `${weekdayShort(d)}, ${formatShort(d)}`;
}
