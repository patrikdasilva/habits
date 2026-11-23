// Normalização/validação de formulários (pura, testável). Lança Error com mensagem em português.
import { isDate, isTime } from "./date";
import type { HabitInput, TaskInput } from "./types";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) ? n : null;
};
const normDays = (v: unknown) => [...new Set(String(v ?? "").split("").filter((c) => /[0-6]/.test(c)))].sort().join("");

export function normalizeHabit(raw: Partial<HabitInput>, today: string): HabitInput {
  const name = str(raw.name, 80);
  if (!name) throw new Error("Informe o nome do hábito.");
  const type = raw.type === "quantity" ? "quantity" : "check";
  const days = normDays(raw.days);
  if (!days) throw new Error("Escolha ao menos um dia da semana.");
  const time = raw.time ? (isTime(raw.time) ? raw.time : null) : null;
  if (raw.time && !time) throw new Error("Horário inválido.");
  let target: number | null = null;
  let step: number | null = null;
  let unit: string | null = null;
  if (type === "quantity") {
    target = num(raw.target);
    if (target == null || target <= 0) throw new Error("Informe uma meta diária maior que zero.");
    step = num(raw.step) ?? 1;
    if (step <= 0) throw new Error("O incremento deve ser maior que zero.");
    unit = str(raw.unit, 20) || null;
  }
  const reminder = !!raw.reminder;
  if (reminder && !time) throw new Error("O lembrete exige um horário.");
  const start = raw.start_date && isDate(raw.start_date) ? raw.start_date : today;
  return {
    id: raw.id,
    name,
    description: str(raw.description, 300),
    category_id: raw.category_id ? Number(raw.category_id) : null,
    type,
    target,
    unit,
    step,
    days,
    time,
    reminder,
    start_date: start,
  };
}

export function normalizeTask(raw: Partial<TaskInput>): TaskInput {
  const title = str(raw.title, 120);
  if (!title) throw new Error("Informe o título da tarefa.");
  const recurrence = (["none", "daily", "weekdays", "weekly", "monthly"] as const).find((r) => r === raw.recurrence) ?? "none";
  const time = raw.time ? (isTime(raw.time) ? raw.time : null) : null;
  if (raw.time && !time) throw new Error("Horário inválido.");
  let days: string | null = null;
  let month_day: number | null = null;
  let date: string | null = null;
  if (recurrence === "none") {
    date = raw.date ? (isDate(raw.date) ? raw.date : null) : null;
    if (raw.date && !date) throw new Error("Data inválida.");
  } else if (recurrence === "weekdays") {
    days = normDays(raw.days);
    if (!days) throw new Error("Escolha ao menos um dia da semana.");
  } else if (recurrence === "weekly") {
    days = normDays(raw.days).slice(0, 1);
    if (!days) throw new Error("Escolha o dia da semana.");
  } else if (recurrence === "monthly") {
    month_day = Math.trunc(num(raw.month_day) ?? 0);
    if (month_day < 1 || month_day > 31) throw new Error("Escolha o dia do mês (1 a 31).");
  }
  const reminder = !!raw.reminder;
  if (reminder && !time) throw new Error("O lembrete exige um horário.");
  const p = Math.trunc(num(raw.priority) ?? 0);
  return {
    id: raw.id,
    title,
    notes: str(raw.notes, 1000),
    category_id: raw.category_id ? Number(raw.category_id) : null,
    priority: p >= 0 && p <= 2 ? p : 0,
    recurrence,
    days,
    month_day,
    date,
    time,
    reminder,
  };
}

export function normalizeCategory(raw: { name?: unknown; color?: unknown; icon?: unknown }) {
  const name = str(raw.name, 40);
  if (!name) throw new Error("Informe o nome da categoria.");
  const color = typeof raw.color === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.color) ? raw.color.toLowerCase() : null;
  if (!color) throw new Error("Cor inválida (use o formato #rrggbb).");
  const icon = str(raw.icon, 40) || "Tag";
  return { name, color, icon };
}
