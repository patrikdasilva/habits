"use server";
import { revalidatePath } from "next/cache";
import { isDate, today } from "@/lib/date";
import * as repo from "@/lib/repo/habits";
import { isAuthenticated } from "@/lib/server/auth";
import { clearReminders, syncReminders } from "@/lib/server/reminders";
import { habitDone, type ItemStatus } from "@/lib/schedule";
import type { HabitInput } from "@/lib/types";
import { normalizeHabit } from "@/lib/validate";
import { fail, type ActionResult } from "./result";

async function guard() {
  if (!(await isAuthenticated())) throw new Error("Sessão expirada. Entre novamente.");
}
const refresh = () => revalidatePath("/", "layout");

export async function saveHabit(raw: HabitInput): Promise<ActionResult<{ id: number }>> {
  try {
    await guard();
    const input = normalizeHabit(raw, today());
    let id: number;
    if (raw.id) {
      id = raw.id;
      await repo.updateHabit(id, input);
    } else id = await repo.createHabit(input);
    const warning = await syncReminders("habit", id);
    refresh();
    return { ok: true, id, ...(warning ? { warning } : {}) };
  } catch (e) {
    return fail(e);
  }
}

/** Marca/desmarca um hábito do tipo check. */
export async function setHabitDone(habitId: number, date: string, done: boolean): Promise<ActionResult> {
  try {
    await guard();
    const h = await repo.getHabit(habitId);
    if (!h) throw new Error("Hábito não encontrado.");
    if (done) await repo.upsertLog(habitId, date, 0, true);
    else await repo.deleteLog(habitId, date);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Estado do dia: feito (check: marca; quantidade: completa a meta), não fiz, ou pendente.
 * "Não fiz" mantém o valor já registrado (quantidade), mas não conta como concluído.
 */
export async function setHabitStatus(habitId: number, date: string, status: ItemStatus): Promise<ActionResult> {
  try {
    await guard();
    if (!isDate(date)) throw new Error("Data inválida.");
    const h = await repo.getHabit(habitId);
    if (!h) throw new Error("Hábito não encontrado.");
    const current = (await repo.logsForDate(date)).find((l) => l.habit_id === habitId);
    const value = current?.value ?? 0;
    if (status === "done") {
      const v = h.type === "quantity" && h.target ? Math.max(value, h.target) : value;
      await repo.upsertLog(habitId, date, v, true);
    } else if (status === "skipped") await repo.upsertLog(habitId, date, value, false, true);
    else if (h.type === "quantity" && value > 0 && !habitDone(h, { value, done: 0 })) await repo.upsertLog(habitId, date, value, false);
    else await repo.deleteLog(habitId, date); // pendente; quantidade já na meta volta para zero
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Define o valor exato do dia (hábito de quantidade). */
export async function setHabitValue(habitId: number, date: string, value: number): Promise<ActionResult> {
  try {
    await guard();
    const h = await repo.getHabit(habitId);
    if (!h) throw new Error("Hábito não encontrado.");
    const v = Math.max(0, Number.isFinite(value) ? Math.round(value * 1000) / 1000 : 0);
    if (v === 0) await repo.deleteLog(habitId, date);
    else await repo.upsertLog(habitId, date, v, habitDone(h, { value: v, done: 0 }));
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function archiveHabit(id: number, archived: boolean): Promise<ActionResult> {
  try {
    await guard();
    await repo.setHabitArchived(id, archived);
    const warning = await syncReminders("habit", id);
    refresh();
    return { ok: true, ...(warning && archived === false ? { warning } : {}) };
  } catch (e) {
    return fail(e);
  }
}

export async function removeHabit(id: number): Promise<ActionResult> {
  try {
    await guard();
    await clearReminders("habit", id).catch(() => null);
    await repo.deleteHabit(id);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
