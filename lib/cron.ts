// Montagem das expressões cron do QStash (fuso America/Sao_Paulo) — funções puras.
import type { Habit, Task } from "./types";

export const CRON_TZ = "America/Sao_Paulo";

function dowList(days: string): string {
  const set = [...new Set(days.split(""))].sort().join("");
  if (set.length === 7) return "*";
  return set.split("").join(",");
}

export function cronForHabit(h: Pick<Habit, "days" | "time">): string | null {
  if (!h.time || !h.days) return null;
  const [hh, mm] = h.time.split(":").map(Number);
  return `${mm} ${hh} * * ${dowList(h.days)}`;
}

export function cronForTask(t: Pick<Task, "recurrence" | "days" | "month_day" | "time">): string | null {
  if (!t.time) return null;
  const [hh, mm] = t.time.split(":").map(Number);
  switch (t.recurrence) {
    case "daily":
      return `${mm} ${hh} * * *`;
    case "weekdays":
      return t.days ? `${mm} ${hh} * * ${dowList(t.days)}` : null;
    case "weekly":
      return t.days ? `${mm} ${hh} * * ${t.days[0]}` : null;
    case "monthly":
      return t.month_day ? `${mm} ${hh} ${t.month_day} * *` : null;
    default:
      return null;
  }
}

/** Instante (segundos Unix) de uma data+hora locais em São Paulo (UTC−3, sem horário de verão desde 2019). */
export function onceTimestamp(date: string, time: string): number {
  return Math.floor(new Date(`${date}T${time}:00-03:00`).getTime() / 1000);
}
