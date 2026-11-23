import { today } from "@/lib/date";
import { query } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const TABLES = ["categories", "habits", "habit_logs", "tasks", "task_completions", "settings"];

/** Exporta todos os dados em JSON (sem as assinaturas de push). */
export async function GET() {
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) data[t] = await query(`SELECT * FROM ${t}`);
  const body = JSON.stringify({ app: "habitos", exported_at: new Date().toISOString(), data }, null, 2);
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="habitos-backup-${today()}.json"`,
    },
  });
}
