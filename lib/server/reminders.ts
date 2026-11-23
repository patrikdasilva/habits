import "server-only";
import { CRON_TZ, cronForHabit, cronForTask, onceTimestamp } from "@/lib/cron";
import { getHabit, setHabitSchedules } from "@/lib/repo/habits";
import { getTask, setTaskSchedules } from "@/lib/repo/tasks";
import { appUrl, pushConfig, qstash } from "./push";

// Cada hábito/tarefa com lembrete ganha um schedule cron no QStash (ou, para tarefa avulsa,
// uma mensagem única com notBefore). Os ids ficam em reminder_schedule_ids: "s:<id>" (schedule) e "m:<id>" (mensagem).

type Kind = "habit" | "task";

async function deleteOld(raw: string | null) {
  if (!raw) return;
  let ids: string[] = [];
  try {
    ids = JSON.parse(raw);
  } catch {
    return;
  }
  const client = qstash();
  await Promise.all(
    ids.map((id) =>
      (id.startsWith("m:") ? client.messages.delete(id.slice(2)) : client.schedules.delete(id.slice(2))).catch(() => null),
    ),
  );
}

/** Apaga os agendamentos do item (ao desativar, arquivar ou excluir). */
export async function clearReminders(kind: Kind, id: number): Promise<void> {
  if (!pushConfig().ok) return;
  const item = kind === "habit" ? await getHabit(id) : await getTask(id);
  if (!item) return;
  await deleteOld(item.reminder_schedule_ids);
  if (kind === "habit") await setHabitSchedules(id, null);
  else await setTaskSchedules(id, null);
}

/**
 * Recria os agendamentos conforme o estado atual. Retorna um aviso (texto) se algo impediu,
 * sem falhar o salvamento do item.
 */
export async function syncReminders(kind: Kind, id: number): Promise<string | null> {
  const item = kind === "habit" ? await getHabit(id) : await getTask(id);
  if (!item) return null;
  const wants = item.reminder === 1 && !!item.time && !item.archived;
  const cfg = pushConfig();
  if (!cfg.ok) return wants ? `Lembrete salvo, mas o push não está configurado no servidor (falta ${cfg.missing.join(", ")}).` : null;
  try {
    await deleteOld(item.reminder_schedule_ids);
    const ids: string[] = [];
    if (wants && item.time) {
      const client = qstash();
      const destination = `${await appUrl()}/api/push/remind`;
      const body = JSON.stringify({ kind, id });
      const headers = { "Content-Type": "application/json" };
      if (kind === "task" && (item as { recurrence: string }).recurrence === "none") {
        const t = item as import("@/lib/types").Task;
        const at = t.date ? onceTimestamp(t.date, item.time) : null;
        if (at && at * 1000 > Date.now()) {
          const res = await client.publishJSON({ url: destination, body: { kind, id }, notBefore: at, retries: 1 });
          if ("messageId" in res) ids.push(`m:${res.messageId}`);
        }
      } else {
        const cron = kind === "habit" ? cronForHabit(item as import("@/lib/types").Habit) : cronForTask(item as import("@/lib/types").Task);
        if (cron) {
          const { scheduleId } = await client.schedules.create({
            scheduleId: `habitos-${kind}-${id}-${crypto.randomUUID().slice(0, 8)}`,
            destination,
            cron: `CRON_TZ=${CRON_TZ} ${cron}`,
            retries: 1,
            headers,
            body,
          });
          ids.push(`s:${scheduleId}`);
        }
      }
    }
    const json = ids.length ? JSON.stringify(ids) : null;
    if (kind === "habit") await setHabitSchedules(id, json);
    else await setTaskSchedules(id, json);
    return null;
  } catch (e) {
    console.error("lembretes: falha no QStash", e);
    return `Salvo, mas o QStash recusou o agendamento do lembrete: ${(e as Error).message}`;
  }
}

