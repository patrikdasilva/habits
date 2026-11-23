import { run } from "@/lib/db/client";
import { isValidSubscription } from "@/lib/server/push";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sub = await req.json().catch(() => null);
  if (!isValidSubscription(sub)) return Response.json({ error: "assinatura inválida" }, { status: 400 });
  await run(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
    [sub.endpoint, sub.keys.p256dh, sub.keys.auth],
  );
  return Response.json({ ok: true });
}
