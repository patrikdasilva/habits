// Service Worker do Hábitos:
//  - guarda o app shell para abrir sem internet (mostra a última tela vista);
//  - exibe as notificações de lembrete (Web Push) e abre o app ao tocar nelas.

const STATIC = "habitos-static-v1";
const PAGES = "habitos-pages-v1";
const META = "habitos-meta-v1";
const MAX_STATIC = 300;

const SHELLS = ["/", "/habitos", "/tarefas", "/estatisticas", "/ajustes", "/categorias"];

const isStatic = (p) =>
  p.startsWith("/_next/static/") || p.startsWith("/icons/") || p === "/icon.svg" || p === "/apple-icon.png" || p === "/manifest.webmanifest";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const keep = [STATIC, PAGES, META];
      for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
      await self.clients.claim();
    })(),
  ),
);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (req.mode === "navigate") {
    event.respondWith(navigate(req, url));
    return;
  }
  if (req.headers.get("RSC")) return;
  if (isStatic(url.pathname)) event.respondWith(cacheFirst(req));
});

/** Rede primeiro; sem resposta em 3,5 s ou offline, a última tela guardada (chave = caminho, sem query). */
async function navigate(req, url) {
  const key = url.pathname;
  const network = fetch(req)
    .then(async (res) => {
      // não guarda redirecionamentos (ex.: sem sessão → /login) nem erros
      if (res.ok && !res.redirected && (res.headers.get("content-type") || "").includes("text/html")) {
        const cache = await caches.open(PAGES);
        await cache.put(key, res.clone());
      }
      return res;
    })
    .catch(() => null);
  const timeout = new Promise((r) => setTimeout(() => r("timeout"), 3500));
  const first = await Promise.race([network, timeout]);
  if (first && first !== "timeout") return first;
  const cached = await caches.match(key, { cacheName: PAGES });
  if (cached) return cached;
  const late = await network;
  return late || offlinePage();
}

async function cacheFirst(req) {
  const hit = await caches.match(req, { cacheName: STATIC });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) {
    const cache = await caches.open(STATIC);
    await cache.put(req, res.clone());
    void trim(cache);
  }
  return res;
}

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_STATIC; i++) await cache.delete(keys[i]);
}

function offlinePage() {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sem conexão</title><body style="font-family:system-ui;background:#171721;color:#ededf3;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center">
<div><h1 style="font-size:18px">Sem conexão</h1>
<p style="color:#c3c3cc;font-size:14px">Esta tela ainda não foi guardada no aparelho.</p>
<a href="/" style="color:#afb2ce;font-weight:600">Voltar ao início</a></div>`,
    { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/* ---------- Guardar o app para uso offline ---------- */

// O app manda { type: "warm", build } ao abrir. A cada deploy novo, as telas são baixadas de novo em segundo plano.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "warm" && data.build) event.waitUntil(warm(String(data.build)));
});

async function warm(build) {
  const meta = await caches.open(META);
  const prev = await meta.match("/__build");
  if (prev && (await prev.text()) === build) return;
  const pages = await caches.open(PAGES);
  const stat = await caches.open(STATIC);
  const assets = new Set();
  for (const path of SHELLS) {
    try {
      const res = await fetch(path, { cache: "no-store", credentials: "same-origin" });
      if (!res.ok || res.redirected) continue;
      const html = await res.clone().text();
      await pages.put(path, res);
      for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\<>]+/g)) assets.add(m[0]);
    } catch {
      return; // sem rede: tenta de novo na próxima abertura
    }
  }
  for (const a of assets) {
    if (await stat.match(a)) continue;
    try {
      const res = await fetch(a);
      if (res.ok) await stat.put(a, res);
    } catch {
      /* segue com os outros */
    }
  }
  await meta.put("/__build", new Response(build));
  await trim(stat);
}

/* ---------- Notificações ---------- */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const client = windows.find((c) => "focus" in c);
      if (client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(url).catch(() => null);
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});

// Push do servidor (agendada no QStash) — chega mesmo com o aparelho bloqueado.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "⏰ Lembrete", {
      body: data.body || "Hora do seu hábito ou tarefa",
      tag: data.tag || "lembrete",
      renotify: true,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: data.url || "/" },
    }),
  );
});
