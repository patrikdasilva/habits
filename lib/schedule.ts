// Regras puras de agenda, metas e streaks (sem acesso a banco). Datas YYYY-MM-DD, horários HH:MM.
import { addDays, dayOfMonth, daysInMonth, diffDays, weekday } from "./date";

export interface HabitRule {
  type: "check" | "quantity";
  target: number | null;
  days: string; // "0123456", 0 = domingo
  start_date: string;
}

export interface HabitLog {
  value: number;
  done: number;
  skipped?: number;
}

/** Estado de um item no dia. */
export type ItemStatus = "pending" | "done" | "skipped";

export interface TaskRule {
  recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly";
  days: string | null;
  month_day: number | null;
  date: string | null;
  start_date: string;
  end_date: string | null;
}

export type Period = "morning" | "afternoon" | "night" | "any";

export const PERIOD_LABEL: Record<Period, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
  any: "Qualquer hora",
};
export const PERIOD_ORDER: Period[] = ["morning", "afternoon", "night", "any"];

/** Manhã 05:00–11:59, Tarde 12:00–17:59, Noite 18:00–04:59, sem horário = qualquer hora. */
export function periodOf(time: string | null | undefined): Period {
  if (!time) return "any";
  const h = Number(time.slice(0, 2));
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "night";
}

/** Ordenação por horário: sem horário vai ao fim; a noite madrugada (00–04h) fica depois das 23h. */
export function timeSortKey(time: string | null | undefined): number {
  if (!time) return 9999;
  const m = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  return m < 300 ? m + 1440 : m;
}

export function habitDueOn(habit: Pick<HabitRule, "days" | "start_date">, date: string): boolean {
  return date >= habit.start_date && habit.days.includes(String(weekday(date)));
}

export function habitDone(habit: Pick<HabitRule, "type" | "target">, log: HabitLog | null | undefined): boolean {
  if (!log || log.skipped === 1) return false;
  if (habit.type === "check") return log.done === 1;
  return habit.target != null && habit.target > 0 ? log.value >= habit.target : log.done === 1;
}

export function taskDueOn(task: TaskRule, date: string): boolean {
  if (date < task.start_date && task.recurrence !== "none") return false;
  if (task.end_date && date > task.end_date) return false;
  switch (task.recurrence) {
    case "none":
      return task.date === date;
    case "daily":
      return true;
    case "weekdays":
      return (task.days ?? "").includes(String(weekday(date)));
    case "weekly":
      return (task.days ?? "")[0] === String(weekday(date));
    case "monthly": {
      if (!task.month_day) return false;
      const target = Math.min(task.month_day, daysInMonth(date));
      return dayOfMonth(date) === target;
    }
  }
}

/** Avulsa com data anterior a hoje e ainda sem conclusão. Recorrentes não acumulam. */
export function isOverdue(task: Pick<TaskRule, "recurrence" | "date">, done: boolean, today: string): boolean {
  return task.recurrence === "none" && !!task.date && task.date < today && !done;
}

export interface Streak {
  current: number;
  best: number;
}

/**
 * Sequência de dias devidos consecutivos concluídos. A atual conta para trás a partir de hoje
 * (se hoje ainda está pendente, começa de ontem sem quebrar; "não fiz" hoje quebra). Dias não devidos são ignorados.
 */
export function calcStreak(
  habit: Pick<HabitRule, "days" | "start_date">,
  doneDates: ReadonlySet<string>,
  today: string,
  skippedToday = false,
): Streak {
  const maxBack = 800;
  const first = diffDays(today, habit.start_date) > maxBack ? addDays(today, -maxBack) : habit.start_date;
  let best = 0;
  let run = 0;
  for (let d = first; d <= today; d = addDays(d, 1)) {
    if (!habitDueOn(habit, d)) continue;
    if (doneDates.has(d)) {
      run++;
      if (run > best) best = run;
    } else if (d === today && !skippedToday) {
      // hoje ainda pode ser feito: não quebra a sequência, mas também não soma
    } else {
      run = 0;
    }
  }
  return { current: run, best };
}

/** Percentual (0–100, inteiro) de dias devidos concluídos nos últimos `days` dias até hoje. */
export function completionRate(
  habit: Pick<HabitRule, "days" | "start_date">,
  doneDates: ReadonlySet<string>,
  today: string,
  days: number,
): number | null {
  let due = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (!habitDueOn(habit, d)) continue;
    due++;
    if (doneDates.has(d)) done++;
  }
  return due ? Math.round((done / due) * 100) : null;
}

/** Texto curto dos dias: "Todos os dias", "Seg–Sex", "Fim de semana" ou "Seg, qua". */
export function daysLabel(days: string): string {
  const short = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const set = [...new Set(days.split(""))].sort().join("");
  if (set === "0123456") return "Todos os dias";
  if (set === "12345") return "Seg–Sex";
  if (set === "06") return "Fim de semana";
  const out = set.split("").map((c) => short[Number(c)]);
  return out.map((s, i) => (i === 0 ? s[0].toUpperCase() + s.slice(1) : s)).join(", ");
}
