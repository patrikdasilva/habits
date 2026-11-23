"use server";
import { revalidatePath } from "next/cache";
import { isDate, today } from "@/lib/date";
import * as repo from "@/lib/repo/tasks";
import { isAuthenticated } from "@/lib/server/auth";
import { clearReminders, syncReminders } from "@/lib/server/reminders";
import type { TaskInput } from "@/lib/types";
import { normalizeTask } from "@/lib/validate";
import { fail, type ActionResult } from "./result";

async function guard() {
  if (!(await isAuthenticated())) throw new Error("Sessão expirada. Entre novamente.");
}
const refresh = () => revalidatePath("/", "layout");

export async function saveTask(raw: TaskInput): Promise<ActionResult<{ id: number }>> {
  try {
    await guard();
    const input = normalizeTask(raw);
    let id: number;
    if (raw.id) {
      id = raw.id;
      await repo.updateTask(id, input);
    } else id = await repo.createTask(input, today());
    const warning = await syncReminders("task", id);
    refresh();
    return { ok: true, id, ...(warning ? { warning } : {}) };
  } catch (e) {
    return fail(e);
  }
}

export async function setTaskDone(taskId: number, date: string, done: boolean): Promise<ActionResult> {
  try {
    await guard();
    if (!isDate(date)) throw new Error("Data inválida.");
    const t = await repo.getTask(taskId);
    if (!t) throw new Error("Tarefa não encontrada.");
    await repo.setCompletion(t, date, done);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function removeTask(id: number): Promise<ActionResult> {
  try {
    await guard();
    await clearReminders("task", id).catch(() => null);
    await repo.deleteTask(id);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
