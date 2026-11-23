import type { Habit } from "./types";

export const fmtNum = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export const targetLabel = (h: Pick<Habit, "type" | "target" | "unit">) =>
  h.type === "quantity" && h.target ? `${fmtNum(h.target)}${h.unit ? ` ${h.unit}` : ""}` : null;

import { weekdayName } from "./date";
import { daysLabel } from "./schedule";
import type { Task } from "./types";

export function recurrenceLabel(t: Pick<Task, "recurrence" | "days" | "month_day">): string {
  switch (t.recurrence) {
    case "daily":
      return "Todos os dias";
    case "weekdays":
      return daysLabel(t.days ?? "");
    case "weekly":
      return t.days ? `Toda ${weekdayName(Number(t.days[0]))}` : "Semanal";
    case "monthly":
      return `Todo dia ${t.month_day}`;
    default:
      return "";
  }
}
