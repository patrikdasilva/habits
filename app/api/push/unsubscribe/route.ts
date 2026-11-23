import { run } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint || typeof body.endpoint !== "string") return Response.json({ error: "endpoint ausente" }, { status: 400 });
  await run("DELETE FROM push_subscriptions WHERE endpoint = ?", [body.endpoint]);
  return Response.json({ ok: true });
}
