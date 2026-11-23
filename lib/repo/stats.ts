import "server-only";
import { addDays, range, startOfWeek } from "@/lib/date";
import { calcStreak, completionRate, habitDone, habitDueOn, taskDueOn } from "@/lib/schedule";
import type { Habit } from "@/lib/types";
import { doneDatesByHabit, listHabits, logsForHabit, logsInRange } from "./habits";
import { completedNoneIds, completionsInRange, listTasks } from "./tasks";

export interface DayCell {
  date: string;
  due: number;
  done: number;
}

export interface CategoryStat {
  category_id: number | null;
  due: number;
  done: number;
}

export interface HabitStat {
  id: number;
  name: string;
  category_id: number | null;
  due: number;
  done: number;
  streak: number;
  best: number;
}

export interface Stats {
  days: number;
  from: string;
  to: string;
  due: number;
  done: number;
  tasksCompleted: number;
  byCategory: CategoryStat[];
  byHabit: HabitStat[];
  cells: DayCell[];
}

export async function getStats(days: number, today: string): Promise<Stats> {
  const from = addDays(today, -(days - 1));
  const dates = range(from, today);
  const [habits, logs, tasks, comps, noneDone, doneMap] = await Promise.all([
    listHabits(),
    logsInRange(from, today),
    listTasks(),
    completionsInRange(from, today),
    completedNoneIds(),
    doneDatesByHabit(),
  ]);
  const logMap = new Map(logs.map((l) => [`${l.habit_id}|${l.date}`, l]));
  const compSet = new Set(comps.map((c) => `${c.task_id}|${c.date}`));

  const cat = new Map<number | null, CategoryStat>();
  const bump = (id: number | null, done: boolean) => {
    const s = cat.get(id) ?? { category_id: id, due: 0, done: 0 };
    s.due++;
    if (done) s.done++;
    cat.set(id, s);
  };
  const cells = new Map<string, DayCell>(dates.map((d) => [d, { date: d, due: 0, done: 0 }]));

  const byHabit: HabitStat[] = habits.map((h) => {
    let due = 0;
    let done = 0;
    for (const d of dates) {
      if (!habitDueOn(h, d)) continue;
      const ok = habitDone(h, logMap.get(`${h.id}|${d}`));
      due++;
      if (ok) done++;
      bump(h.category_id, ok);
      const c = cells.get(d)!;
      c.due++;
      if (ok) c.done++;
    }
    const s = calcStreak(h, doneMap.get(h.id) ?? new Set(), today);
    return { id: h.id, name: h.name, category_id: h.category_id, due, done, streak: s.current, best: s.best };
  });

  for (const t of tasks) {
    for (const d of dates) {
      if (!taskDueOn(t, d)) continue;
      const ok = t.recurrence === "none" ? noneDone.has(t.id) : compSet.has(`${t.id}|${d}`);
      bump(t.category_id, ok);
      const c = cells.get(d)!;
      c.due++;
      if (ok) c.done++;
    }
  }

  const cellList = [...cells.values()];
  return {
    days,
    from,
    to: today,
    due: cellList.reduce((a, c) => a + c.due, 0),
    done: cellList.reduce((a, c) => a + c.done, 0),
    tasksCompleted: comps.length,
    byCategory: [...cat.values()].sort((a, b) => b.due - a.due),
    byHabit: byHabit.filter((h) => h.due > 0).sort((a, b) => b.streak - a.streak || b.done / (b.due || 1) - a.done / (a.due || 1)),
    cells: cellList,
  };
}

export interface HabitDetail {
  habit: Habit;
  streak: number;
  best: number;
  rate30: number | null;
  heat: { date: string; due: boolean; ratio: number }[]; // 12 semanas, alinhadas a domingo
  history: { date: string; due: boolean; value: number; done: boolean }[];
  totalDone: number;
}

export async function getHabitDetail(habit: Habit, today: string): Promise<HabitDetail> {
  const from = addDays(startOfWeek(today), -7 * 11);
  const logs = await logsForHabit(habit.id, from, today);
  const logMap = new Map(logs.map((l) => [l.date, l]));
  const doneMap = await doneDatesByHabit();
  const doneDates = doneMap.get(habit.id) ?? new Set<string>();
  const s = calcStreak(habit, doneDates, today);
  const heat = range(from, addDays(startOfWeek(today), 6)).map((date) => {
    const due = habitDueOn(habit, date) && date <= today;
    const log = logMap.get(date);
    let ratio = 0;
    if (log) ratio = habit.type === "quantity" && habit.target ? Math.min(1, log.value / habit.target) : log.done ? 1 : 0;
    return { date, due, ratio };
  });
  const historyFrom = addDays(today, -29);
  const history = range(historyFrom, today)
    .reverse()
    .filter((d) => habitDueOn(habit, d) || logMap.has(d))
    .map((date) => {
      const l = logMap.get(date);
      return { date, due: habitDueOn(habit, date), value: l?.value ?? 0, done: habitDone(habit, l) };
    });
  return { habit, streak: s.current, best: s.best, rate30: completionRate(habit, doneDates, today, 30), heat, history, totalDone: doneDates.size };
}
