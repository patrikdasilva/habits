import "server-only";
import { headers } from "next/headers";
import { Client, Receiver } from "@upstash/qstash";
import webpush, { type PushSubscription } from "web-push";
import { query, run } from "@/lib/db/client";

// Web Push (VAPID) agendada no Upstash QStash: o QStash chama /api/push/remind no horário
// e o servidor envia a notificação a todos os aparelhos inscritos.

export function pushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:habitos@example.com";
  const qstashOk = !!process.env.QSTASH_TOKEN;
  const signing = !!process.env.QSTASH_CURRENT_SIGNING_KEY && !!process.env.QSTASH_NEXT_SIGNING_KEY;
  return {
    ok: !!publicKey && !!privateKey && qstashOk && signing,
    /** O que falta (só nomes das variáveis, nunca valores), para o diagnóstico em Ajustes. */
    missing: [
      !publicKey && "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
      !privateKey && "VAPID_PRIVATE_KEY",
      !qstashOk && "QSTASH_TOKEN",
      !signing && "QSTASH_CURRENT_SIGNING_KEY / QSTASH_NEXT_SIGNING_KEY",
    ].filter(Boolean) as string[],
    publicKey,
    privateKey,
    subject,
  };
}

export const qstash = () => new Client(); // lê QSTASH_TOKEN / QSTASH_URL
export const receiver = () => new Receiver(); // lê QSTASH_*_SIGNING_KEY

/** Aceita apenas assinaturas de serviços de push conhecidos (evita uso como proxy HTTP). */
export function isValidSubscription(s: unknown): s is PushSubscription {
  if (!s || typeof s !== "object") return false;
  const sub = s as PushSubscription;
  if (typeof sub.endpoint !== "string" || !sub.keys?.p256dh || !sub.keys?.auth) return false;
  try {
    const url = new URL(sub.endpoint);
    return (
      url.protocol === "https:" &&
      [
        "web.push.apple.com",
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "push.services.mozilla.com",
        "notify.windows.com",
        "android.googleapis.com",
      ].some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`))
    );
  } catch {
    return false;
  }
}

/** URL pública do app para o QStash chamar de volta. */
export async function appUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_ENV === "production")
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

interface SubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface Notice {
  title: string;
  body: string;
  tag?: string;
}

/** Envia a todos os aparelhos inscritos; remove as assinaturas expiradas (404/410). */
export async function sendToAll(n: Notice): Promise<{ sent: number; removed: number; failed: number }> {
  const cfg = pushConfig();
  webpush.setVapidDetails(cfg.subject, cfg.publicKey!, cfg.privateKey!);
  const subs = await query<SubRow>("SELECT endpoint, p256dh, auth FROM push_subscriptions");
  let sent = 0;
  let removed = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: n.title, body: n.body, url: "/", tag: n.tag ?? "lembrete" }),
          { TTL: 3 * 3600, urgency: "normal" },
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await run("DELETE FROM push_subscriptions WHERE endpoint = ?", [s.endpoint]);
          removed++;
        } else failed++;
      }
    }),
  );
  return { sent, removed, failed };
}
