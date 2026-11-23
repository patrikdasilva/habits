import { query } from "@/lib/db/client";
import { today } from "@/lib/date";
import { getHabit, logsForDate } from "@/lib/repo/habits";
import { completedNoneIds, completionsForDate, getTask } from "@/lib/repo/tasks";
import { habitDone, habitDueOn, taskDueOn } from "@/lib/schedule";
import { pushConfig, receiver, sendToAll } from "@/lib/server/push";

export const dynamic = "force-dynamic";

async function categoryName(id: number | null) {
  if (!id) return null;
  return (await query<{ name: string }>("SELECT name FROM categories WHERE id = ?", [id]))[0]?.name ?? null;
}

/** Chamado pelo QStash (assinatura verificada). Só envia se o item é devido hoje e ainda não foi concluído. */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("upstash-signature");
  const valid = signature ? await receiver().verify({ signature, body: raw }).catch(() => false) : false;
  if (!valid) return new Response("assinatura inválida", { status: 401 });
  if (!pushConfig().ok) return new Response("push não configurado", { status: 200 });

  const { kind, id } = (JSON.parse(raw) ?? {}) as { kind?: string; id?: number };
  const day = today();
  const parts: string[] = [];

  if (kind === "habit") {
    const h = await getHabit(Number(id));
    if (!h || h.archived || !h.reminder || !habitDueOn(h, day)) return new Response("ignorado");
    const log = (await logsForDate(day)).find((l) => l.habit_id === h.id);
    if (habitDone(h, log)) return new Response("já concluído");
    if (h.type === "quantity" && h.target) parts.push(`Meta: ${h.target}${h.unit ? ` ${h.unit}` : ""}`);
    if (h.time) parts.push(h.time);
    const cat = await categoryName(h.category_id);
    if (cat) parts.push(cat);
    const r = await sendToAll({ title: `⏰ ${h.name}`, body: parts.join(" · ") || "Hora do hábito", tag: `habit-${h.id}` });
    return Response.json(r);
  }
  if (kind === "task") {
    const t = await getTask(Number(id));
    if (!t || t.archived || !t.reminder) return new Response("ignorado");
    if (!taskDueOn(t, day)) return new Response("não é devida hoje");
    const done = t.recurrence === "none" ? (await completedNoneIds()).has(t.id) : (await completionsForDate(day)).some((c) => c.task_id === t.id);
    if (done) return new Response("já concluída");
    if (t.time) parts.push(t.time);
    const cat = await categoryName(t.category_id);
    if (cat) parts.push(cat);
    const r = await sendToAll({ title: `⏰ ${t.title}`, body: parts.join(" · ") || "Tarefa para hoje", tag: `task-${t.id}` });
    return Response.json(r);
  }
  return new Response("tipo inválido", { status: 400 });
}
