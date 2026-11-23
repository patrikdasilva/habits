import { pushConfig, sendToAll } from "@/lib/server/push";

export const dynamic = "force-dynamic";

export async function POST() {
  const cfg = pushConfig();
  if (!cfg.ok) return Response.json({ error: `push não configurado (falta ${cfg.missing.join(", ")})` }, { status: 501 });
  const r = await sendToAll({ title: "⏰ Teste de lembrete", body: "As notificações estão funcionando neste aparelho.", tag: "teste" });
  if (!r.sent) return Response.json({ error: "nenhum aparelho inscrito recebeu a notificação", ...r }, { status: 404 });
  return Response.json({ ok: true, ...r });
}
