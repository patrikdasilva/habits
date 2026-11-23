import { describe, expect, it } from "vitest";
import { addDays, daysInMonth, today, weekday } from "@/lib/date";
import {
  calcStreak,
  completionRate,
  daysLabel,
  habitDone,
  habitDueOn,
  isOverdue,
  periodOf,
  taskDueOn,
  timeSortKey,
  type TaskRule,
} from "@/lib/schedule";

const task = (p: Partial<TaskRule>): TaskRule => ({
  recurrence: "none",
  days: null,
  month_day: null,
  date: null,
  start_date: "2025-01-01",
  end_date: null,
  ...p,
});

describe("datas", () => {
  it("today usa o fuso de São Paulo (23h local ainda é o mesmo dia)", () => {
    expect(today(new Date("2025-03-10T01:30:00Z"))).toBe("2025-03-09"); // 22:30 em SP
    expect(today(new Date("2025-03-10T03:00:00Z"))).toBe("2025-03-10"); // 00:00 em SP
  });
  it("addDays, weekday e daysInMonth", () => {
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(weekday("2025-03-09")).toBe(0); // domingo
    expect(daysInMonth("2024-02-10")).toBe(29);
    expect(daysInMonth("2025-02-10")).toBe(28);
  });
});

describe("períodos", () => {
  it("classifica por horário", () => {
    expect(periodOf("05:00")).toBe("morning");
    expect(periodOf("11:59")).toBe("morning");
    expect(periodOf("12:00")).toBe("afternoon");
    expect(periodOf("17:59")).toBe("afternoon");
    expect(periodOf("18:00")).toBe("night");
    expect(periodOf("04:59")).toBe("night");
    expect(periodOf(null)).toBe("any");
  });
  it("ordena madrugada depois da noite", () => {
    expect(timeSortKey("23:00")).toBeLessThan(timeSortKey("01:00"));
    expect(timeSortKey("01:00")).toBeLessThan(timeSortKey(null));
  });
});

describe("habitDueOn / habitDone", () => {
  const h = { type: "check" as const, target: null, days: "135", start_date: "2025-03-03" };
  it("respeita dia da semana e data de início", () => {
    expect(habitDueOn(h, "2025-03-03")).toBe(true); // segunda
    expect(habitDueOn(h, "2025-03-04")).toBe(false); // terça
    expect(habitDueOn(h, "2025-02-26")).toBe(false); // antes do início (quarta)
  });
  it("check usa done; quantity compara com a meta", () => {
    expect(habitDone(h, { value: 0, done: 1 })).toBe(true);
    expect(habitDone(h, null)).toBe(false);
    const q = { type: "quantity" as const, target: 3000 };
    expect(habitDone(q, { value: 2999, done: 0 })).toBe(false);
    expect(habitDone(q, { value: 3000, done: 1 })).toBe(true);
  });
});

describe("taskDueOn", () => {
  it("avulsa só na própria data", () => {
    const t = task({ date: "2025-03-10" });
    expect(taskDueOn(t, "2025-03-10")).toBe(true);
    expect(taskDueOn(t, "2025-03-11")).toBe(false);
    expect(taskDueOn(task({}), "2025-03-10")).toBe(false);
  });
  it("diária respeita início e fim", () => {
    const t = task({ recurrence: "daily", start_date: "2025-03-05", end_date: "2025-03-08" });
    expect(taskDueOn(t, "2025-03-04")).toBe(false);
    expect(taskDueOn(t, "2025-03-05")).toBe(true);
    expect(taskDueOn(t, "2025-03-08")).toBe(true);
    expect(taskDueOn(t, "2025-03-09")).toBe(false);
  });
  it("dias da semana e semanal (primeiro dia)", () => {
    expect(taskDueOn(task({ recurrence: "weekdays", days: "135" }), "2025-03-10")).toBe(true); // segunda
    expect(taskDueOn(task({ recurrence: "weekdays", days: "135" }), "2025-03-11")).toBe(false);
    const w = task({ recurrence: "weekly", days: "3" });
    expect(taskDueOn(w, "2025-03-12")).toBe(true); // quarta
    expect(taskDueOn(w, "2025-03-13")).toBe(false);
  });
  it("mensal usa o último dia quando o mês é curto", () => {
    const m = task({ recurrence: "monthly", month_day: 31 });
    expect(taskDueOn(m, "2025-02-28")).toBe(true);
    expect(taskDueOn(m, "2025-02-27")).toBe(false);
    expect(taskDueOn(m, "2025-04-30")).toBe(true);
    expect(taskDueOn(m, "2025-01-31")).toBe(true);
    expect(taskDueOn(task({ recurrence: "monthly", month_day: 15 }), "2025-03-15")).toBe(true);
  });
});

describe("atrasadas", () => {
  it("só avulsas com data passada e não concluídas", () => {
    expect(isOverdue({ recurrence: "none", date: "2025-03-09" }, false, "2025-03-10")).toBe(true);
    expect(isOverdue({ recurrence: "none", date: "2025-03-09" }, true, "2025-03-10")).toBe(false);
    expect(isOverdue({ recurrence: "none", date: "2025-03-10" }, false, "2025-03-10")).toBe(false);
    expect(isOverdue({ recurrence: "none", date: null }, false, "2025-03-10")).toBe(false);
    expect(isOverdue({ recurrence: "daily", date: null }, false, "2025-03-10")).toBe(false);
  });
});

describe("streak", () => {
  const daily = { days: "0123456", start_date: "2025-01-01" };
  it("conta para trás; hoje pendente não quebra", () => {
    const done = new Set(["2025-03-08", "2025-03-09"]);
    expect(calcStreak(daily, done, "2025-03-10")).toEqual({ current: 2, best: 2 });
    expect(calcStreak(daily, new Set([...done, "2025-03-10"]), "2025-03-10").current).toBe(3);
  });
  it("falha em dia devido anterior zera a atual e preserva a melhor", () => {
    const done = new Set(["2025-03-01", "2025-03-02", "2025-03-03", "2025-03-04", "2025-03-08"]);
    expect(calcStreak(daily, done, "2025-03-10")).toEqual({ current: 0, best: 4 });
  });
  it("ignora dias não devidos", () => {
    const wk = { days: "12345", start_date: "2025-01-01" }; // seg–sex
    // 2025-03-07 sexta, 03-08/09 fim de semana, 03-10 segunda (hoje, pendente)
    const done = new Set(["2025-03-06", "2025-03-07"]);
    expect(calcStreak(wk, done, "2025-03-10").current).toBe(2);
    expect(calcStreak(wk, new Set([...done, "2025-03-10"]), "2025-03-10").current).toBe(3);
  });
  it("sem registros é zero", () => {
    expect(calcStreak(daily, new Set(), "2025-03-10")).toEqual({ current: 0, best: 0 });
  });
});

describe("completionRate e daysLabel", () => {
  it("percentual dos dias devidos", () => {
    const h = { days: "0123456", start_date: "2025-01-01" };
    expect(completionRate(h, new Set(["2025-03-10", "2025-03-09"]), "2025-03-10", 4)).toBe(50);
    expect(completionRate({ days: "0123456", start_date: "2025-03-11" }, new Set(), "2025-03-10", 7)).toBeNull();
  });
  it("rótulos de dias", () => {
    expect(daysLabel("0123456")).toBe("Todos os dias");
    expect(daysLabel("12345")).toBe("Seg–Sex");
    expect(daysLabel("06")).toBe("Fim de semana");
    expect(daysLabel("13")).toBe("Seg, qua");
  });
});

describe("não fiz", () => {
  const daily = { days: "0123456", start_date: "2025-03-01" };
  it("hábito marcado como não fiz não conta como concluído", () => {
    expect(habitDone({ type: "check", target: null }, { value: 0, done: 1, skipped: 1 })).toBe(false);
    expect(habitDone({ type: "quantity", target: 10 }, { value: 12, done: 0, skipped: 1 })).toBe(false);
  });
  it("não fiz hoje quebra a sequência; pendente hoje não", () => {
    const done = new Set(["2025-03-08", "2025-03-09"]);
    expect(calcStreak(daily, done, "2025-03-10").current).toBe(2);
    expect(calcStreak(daily, done, "2025-03-10", true).current).toBe(0);
    expect(calcStreak(daily, done, "2025-03-10", true).best).toBe(2);
  });
});
