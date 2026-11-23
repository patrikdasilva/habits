import "server-only";
import { getDb, query, run } from "@/lib/db/client";
import { isOverdue, taskDueOn, timeSortKey } from "@/lib/schedule";
import type { Task, TaskInput, TaskView } from "@/lib/types";

const COLS =
  "id, title, notes, category_id, priority, recurrence, days, month_day, date, time, reminder, reminder_schedule_ids, start_date, end_date, archived";

export const listTasks = () => query<Task>(`SELECT ${COLS} FROM tasks WHERE archived = 0 ORDER BY id`);
export const getTask = async (id: number) => (await query<Task>(`SELECT ${COLS} FROM tasks WHERE id = ?`, [id]))[0] ?? null;

export interface CompletionRow {
  task_id: number;
  date: string;
  done_at: string;
}

export const completionsForDate = (date: string) =>
  query<CompletionRow>("SELECT task_id, date, done_at FROM task_completions WHERE date = ?", [date]);
export const completionsInRange = (from: string, to: string) =>
  query<CompletionRow>("SELECT task_id, date, done_at FROM task_completions WHERE date >= ? AND date <= ?", [from, to]);
/** Tarefas avulsas concluídas (qualquer data). */
export const completedNoneIds = async () =>
  new Set(
    (
      await query<{ task_id: number }>(
        "SELECT DISTINCT c.task_id FROM task_completions c JOIN tasks t ON t.id = c.task_id WHERE t.recurrence = 'none'",
      )
    ).map((r) => r.task_id),
  );

export const sortTasks = <T extends Task>(a: T, b: T) =>
  timeSortKey(a.time) - timeSortKey(b.time) || b.priority - a.priority || a.id - b.id;

/** Tarefas do dia (avulsas + ocorrências recorrentes). Em "hoje", inclui as atrasadas à parte. */
export async function taskViewsForDate(date: string, today: string): Promise<{ overdue: TaskView[]; day: TaskView[] }> {
  const [tasks, comps, noneDone] = await Promise.all([listTasks(), completionsForDate(date), completedNoneIds()]);
  const doneToday = new Set(comps.map((c) => c.task_id));
  const day: TaskView[] = [];
  const overdue: TaskView[] = [];
  for (const t of tasks) {
    const done = t.recurrence === "none" ? noneDone.has(t.id) : doneToday.has(t.id);
    if (taskDueOn(t, date)) day.push({ ...t, done, overdue: false });
    else if (date === today && isOverdue(t, done, today)) overdue.push({ ...t, done, overdue: true });
  }
  overdue.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || sortTasks(a, b));
  day.sort((a, b) => Number(a.done) - Number(b.done) || sortTasks(a, b));
  return { overdue, day };
}

export async function createTask(i: TaskInput, startDate: string): Promise<number> {
  const rs = await run(
    `INSERT INTO tasks (title, notes, category_id, priority, recurrence, days, month_day, date, time, reminder, start_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [i.title, i.notes, i.category_id, i.priority, i.recurrence, i.days, i.month_day, i.date, i.time, i.reminder ? 1 : 0, startDate],
  );
  return Number(rs.lastInsertRowid);
}

export async function updateTask(id: number, i: TaskInput) {
  await run(
    `UPDATE tasks SET title = ?, notes = ?, category_id = ?, priority = ?, recurrence = ?, days = ?, month_day = ?, date = ?, time = ?,
       reminder = ? WHERE id = ?`,
    [i.title, i.notes, i.category_id, i.priority, i.recurrence, i.days, i.month_day, i.date, i.time, i.reminder ? 1 : 0, id],
  );
}

export const setTaskArchived = (id: number, archived: boolean) => run("UPDATE tasks SET archived = ? WHERE id = ?", [archived ? 1 : 0, id]);
export const setTaskSchedules = (id: number, ids: string | null) => run("UPDATE tasks SET reminder_schedule_ids = ? WHERE id = ?", [ids, id]);

export async function deleteTask(id: number) {
  const db = await getDb();
  await db.batch(
    [
      { sql: "DELETE FROM task_completions WHERE task_id = ?", args: [id] },
      { sql: "DELETE FROM tasks WHERE id = ?", args: [id] },
    ],
    "write",
  );
}

/** Marca/desmarca. Avulsa: uma única conclusão (data = a data da tarefa, ou o dia em que concluiu). */
export async function setCompletion(task: Task, date: string, done: boolean) {
  const db = await getDb();
  if (task.recurrence === "none") {
    const key = task.date ?? date;
    await db.batch(
      done
        ? [
            { sql: "DELETE FROM task_completions WHERE task_id = ?", args: [task.id] },
            { sql: "INSERT INTO task_completions (task_id, date) VALUES (?, ?)", args: [task.id, key] },
          ]
        : [{ sql: "DELETE FROM task_completions WHERE task_id = ?", args: [task.id] }],
      "write",
    );
    return;
  }
  if (done) await run("INSERT OR IGNORE INTO task_completions (task_id, date) VALUES (?, ?)", [task.id, date]);
  else await run("DELETE FROM task_completions WHERE task_id = ? AND date = ?", [task.id, date]);
}

export interface TaskWithDone extends Task {
  done: boolean;
  done_date: string | null;
}

/** Visões para a tela de tarefas. */
export async function taskLists(today: string, nextDays: string[]) {
  const [tasks, noneComp, recentComps] = await Promise.all([
    listTasks(),
    query<CompletionRow>("SELECT c.task_id, c.date, c.done_at FROM task_completions c JOIN tasks t ON t.id = c.task_id WHERE t.recurrence = 'none'"),
    query<CompletionRow>(
      `SELECT c.task_id, c.date, c.done_at FROM task_completions c JOIN tasks t ON t.id = c.task_id AND t.archived = 0
       ORDER BY c.done_at DESC, c.date DESC LIMIT 80`,
    ),
  ]);
  const noneDone = new Set(noneComp.map((c) => c.task_id));
  const todayComps = new Set((await completionsForDate(today)).map((c) => c.task_id));
  const view = (t: Task, date: string): TaskView => {
    const done = t.recurrence === "none" ? noneDone.has(t.id) : todayComps.has(t.id);
    return { ...t, done, overdue: isOverdue(t, done, date) };
  };
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const today_ = await taskViewsForDate(today, today);
  const nextComps = nextDays.length ? await completionsInRange(nextDays[0], nextDays[nextDays.length - 1]) : [];
  const nextSet = new Set(nextComps.map((c) => `${c.task_id}|${c.date}`));
  const upcoming = nextDays.map((d) => ({
    date: d,
    tasks: tasks
      .filter((t) => taskDueOn(t, d))
      .map((t) => ({ ...t, done: t.recurrence === "none" ? noneDone.has(t.id) : nextSet.has(`${t.id}|${d}`), overdue: false }) as TaskView)
      .sort(sortTasks),
  }));
  return {
    today: today_,
    upcoming,
    inbox: tasks.filter((t) => t.recurrence === "none" && !t.date && !noneDone.has(t.id)).map((t) => view(t, today)),
    recurring: tasks.filter((t) => t.recurrence !== "none").map((t) => view(t, today)),
    completed: recentComps
      .filter((c) => byId.has(c.task_id))
      .map((c) => ({ ...view(byId.get(c.task_id)!, today), done: true, completedOn: c.date, doneAt: c.done_at })),
  };
}
