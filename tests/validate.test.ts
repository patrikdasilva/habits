import { describe, expect, it } from "vitest";
import { cronForHabit, cronForTask, onceTimestamp } from "@/lib/cron";
import { normalizeHabit, normalizeTask } from "@/lib/validate";

const base = { description: "", category_id: null, days: "0123456", reminder: false, start_date: "2025-03-10" };

describe("normalizeHabit", () => {
  it("exige nome, dia e meta para quantidade", () => {
    expect(() => normalizeHabit({ ...base, name: " ", type: "check", target: null, unit: null, step: null, time: null }, "2025-03-10")).toThrow(/nome/);
    expect(() => normalizeHabit({ ...base, name: "x", type: "check", target: null, unit: null, step: null, time: null, days: "" }, "2025-03-10")).toThrow(/dia/);
    expect(() => normalizeHabit({ ...base, name: "x", type: "quantity", target: 0, unit: "ml", step: 1, time: null }, "2025-03-10")).toThrow(/meta/);
  });
  it("lembrete exige horário e limpa campos de quantidade em check", () => {
    expect(() => normalizeHabit({ ...base, name: "x", type: "check", target: null, unit: null, step: null, time: null, reminder: true }, "2025-03-10")).toThrow(/horário/);
    const h = normalizeHabit({ ...base, name: " Água ", type: "check", target: 5, unit: "ml", step: 1, time: "08:30", days: "3311" }, "2025-03-10");
    expect(h).toMatchObject({ name: "Água", target: null, unit: null, step: null, days: "13", time: "08:30" });
  });
});

describe("normalizeTask", () => {
  it("campos condicionais por recorrência", () => {
    const t = normalizeTask({ title: "a", recurrence: "monthly", month_day: 31, days: "1", date: "2025-01-01" });
    expect(t).toMatchObject({ month_day: 31, days: null, date: null });
    expect(() => normalizeTask({ title: "a", recurrence: "monthly", month_day: 40 })).toThrow();
    expect(normalizeTask({ title: "a", recurrence: "weekly", days: "35" }).days).toBe("3");
    expect(normalizeTask({ title: "a", recurrence: "none", date: null }).date).toBeNull();
  });
});

describe("cron do QStash", () => {
  it("hábito", () => {
    expect(cronForHabit({ days: "0123456", time: "21:30" })).toBe("30 21 * * *");
    expect(cronForHabit({ days: "12345", time: "07:05" })).toBe("5 7 * * 1,2,3,4,5");
    expect(cronForHabit({ days: "12345", time: null })).toBeNull();
  });
  it("tarefa", () => {
    expect(cronForTask({ recurrence: "daily", days: null, month_day: null, time: "09:00" })).toBe("0 9 * * *");
    expect(cronForTask({ recurrence: "weekly", days: "3", month_day: null, time: "09:00" })).toBe("0 9 * * 3");
    expect(cronForTask({ recurrence: "monthly", days: null, month_day: 15, time: "18:45" })).toBe("45 18 15 * *");
    expect(cronForTask({ recurrence: "none", days: null, month_day: null, time: "09:00" })).toBeNull();
  });
  it("instante único em UTC−3", () => {
    expect(onceTimestamp("2025-03-10", "09:00")).toBe(Date.UTC(2025, 2, 10, 12, 0) / 1000);
  });
});
