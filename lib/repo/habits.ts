import "server-only";
import { getDb, query, run } from "@/lib/db/client";
import { calcStreak, habitDone, habitDueOn, timeSortKey } from "@/lib/schedule";
import type { Habit, HabitInput, HabitView } from "@/lib/types";

const COLS = "id, name, description, category_id, type, target, unit, step, days, time, reminder, reminder_schedule_ids, start_date, archived, sort";

export const listHabits = (archived = false) =>
  query<Habit>(`SELECT ${COLS} FROM habits WHERE archived = ? ORDER BY sort, id`, [archived ? 1 : 0]);

export const getHabit = async (id: number) => (await query<Habit>(`SELECT ${COLS} FROM habits WHERE id = ?`, [id]))[0] ?? null;

export interface LogRow {
  habit_id: number;
  date: string;
  value: number;
  done: number;
  skipped: number;
}

export const logsForDate = (date: string) =>
  query<LogRow>("SELECT habit_id, date, value, done, skipped FROM habit_logs WHERE date = ?", [date]);

export const logsForHabit = (habitId: number, from: string, to: string) =>
  query<LogRow>("SELECT habit_id, date, value, done, skipped FROM habit_logs WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date", [
    habitId,
    from,
    to,
  ]);

export const logsInRange = (from: string, to: string) =>
  query<LogRow>("SELECT habit_id, date, value, done, skipped FROM habit_logs WHERE date >= ? AND date <= ?", [from, to]);

/** Datas concluídas por hábito (para streaks). */
export async function doneDatesByHabit(): Promise<Map<number, Set<string>>> {
  const rows = await query<{ habit_id: number; date: string }>("SELECT habit_id, date FROM habit_logs WHERE done = 1");
  const m = new Map<number, Set<string>>();
  for (const r of rows) {
    if (!m.has(r.habit_id)) m.set(r.habit_id, new Set());
    m.get(r.habit_id)!.add(r.date);
  }
  return m;
}

/** Hábitos devidos em `date`, ordenados por horário, com progresso e streak. */
export async function habitViewsForDate(date: string, today: string): Promise<HabitView[]> {
  const [habits, logs, doneMap] = await Promise.all([listHabits(), logsForDate(date), doneDatesByHabit()]);
  const byId = new Map(logs.map((l) => [l.habit_id, l]));
  return habits
    .filter((h) => habitDueOn(h, date))
    .map((h) => {
      const log = byId.get(h.id);
      const skipped = log?.skipped === 1;
      const s = calcStreak(h, doneMap.get(h.id) ?? new Set(), today, date === today && skipped);
      return { ...h, value: log?.value ?? 0, done: habitDone(h, log), skipped, streak: s.current, best: s.best };
    })
    .sort((a, b) => timeSortKey(a.time) - timeSortKey(b.time) || a.sort - b.sort || a.id - b.id);
}

export async function createHabit(i: HabitInput): Promise<number> {
  const max = (await query<{ m: number | null }>("SELECT MAX(sort) AS m FROM habits"))[0]?.m ?? -1;
  const rs = await run(
    `INSERT INTO habits (name, description, category_id, type, target, unit, step, days, time, reminder, start_date, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [i.name, i.description, i.category_id, i.type, i.target, i.unit, i.step, i.days, i.time, i.reminder ? 1 : 0, i.start_date, (max ?? -1) + 1],
  );
  return Number(rs.lastInsertRowid);
}

export async function updateHabit(id: number, i: HabitInput) {
  await run(
    `UPDATE habits SET name = ?, description = ?, category_id = ?, type = ?, target = ?, unit = ?, step = ?, days = ?, time = ?,
       reminder = ?, start_date = ? WHERE id = ?`,
    [i.name, i.description, i.category_id, i.type, i.target, i.unit, i.step, i.days, i.time, i.reminder ? 1 : 0, i.start_date, id],
  );
}

export const setHabitArchived = (id: number, archived: boolean) => run("UPDATE habits SET archived = ? WHERE id = ?", [archived ? 1 : 0, id]);
export const setHabitSchedules = (id: number, ids: string | null) => run("UPDATE habits SET reminder_schedule_ids = ? WHERE id = ?", [ids, id]);

export async function deleteHabit(id: number) {
  const db = await getDb();
  await db.batch(
    [
      { sql: "DELETE FROM habit_logs WHERE habit_id = ?", args: [id] },
      { sql: "DELETE FROM habits WHERE id = ?", args: [id] },
    ],
    "write",
  );
}

export async function upsertLog(habitId: number, date: string, value: number, done: boolean, skipped = false) {
  await run(
    `INSERT INTO habit_logs (habit_id, date, value, done, skipped, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(habit_id, date) DO UPDATE SET value = excluded.value, done = excluded.done, skipped = excluded.skipped,
       updated_at = excluded.updated_at`,
    [habitId, date, value, done ? 1 : 0, skipped ? 1 : 0],
  );
}

export const deleteLog = (habitId: number, date: string) => run("DELETE FROM habit_logs WHERE habit_id = ? AND date = ?", [habitId, date]);
