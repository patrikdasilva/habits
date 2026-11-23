"use client";
import { Bell, BellOff, BellRing, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useUI } from "./Providers";
import { Button, Card } from "./ui";

function urlBase64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function Notifications({ ok, missing, publicKey, devices }: { ok: boolean; missing: string[]; publicKey: string | null; devices: number }) {
  const { toast } = useUI();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sup = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(sup);
    if (!sup) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.getRegistration("/").then((reg) => reg?.pushManager.getSubscription()).then((s) => setSubscribed(!!s)).catch(() => null);
  }, []);

  async function enable() {
    if (!publicKey) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") throw new Error("Permissão negada. Libere as notificações nos ajustes do navegador.");
      const reg = (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error("O servidor recusou a assinatura.");
      setSubscribed(true);
      toast("Notificações ativadas neste aparelho", "success");
    } catch (e) {
      toast((e as Error).message || "Não foi possível ativar.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast("Notificações desativadas neste aparelho");
    } catch {
      toast("Não foi possível desativar.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Falha ao enviar o teste.");
      toast("Teste enviado. A notificação deve chegar em instantes.", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (!ok) {
    return (
      <Card className="space-y-2.5">
        <p className="flex items-center gap-2 font-semibold"><TriangleAlert size={17} className="text-accent" /> Notificações não configuradas</p>
        <p className="text-sm text-muted">O app funciona normalmente, mas os lembretes precisam destas variáveis no servidor:</p>
        <ul className="space-y-1">
          {missing.map((m) => <li key={m}><code className="rounded-md bg-surface-2 px-2 py-0.5 text-[13px]">{m}</code></li>)}
        </ul>
        <p className="text-sm text-muted">Veja o README para gerar as chaves VAPID e conectar o QStash.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">{subscribed ? <BellRing size={19} /> : <BellOff size={19} />}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{subscribed ? "Ativadas neste aparelho" : "Desativadas neste aparelho"}</p>
          <p className="text-sm text-muted">{devices} {devices === 1 ? "aparelho inscrito" : "aparelhos inscritos"} no total</p>
        </div>
      </div>
      {supported === false && <p className="text-sm text-muted">Este navegador não suporta notificações push. No iPhone, instale o app na Tela de Início primeiro.</p>}
      {permission === "denied" && <p className="text-sm text-muted">As notificações estão bloqueadas no navegador. Libere nos ajustes do site para ativar.</p>}
      <div className="flex flex-wrap gap-2.5">
        {subscribed ? (
          <Button onClick={disable} loading={busy}>Desativar</Button>
        ) : (
          <Button variant="primary" onClick={enable} loading={busy} disabled={supported === false || permission === "denied"}><Bell size={16} /> Ativar notificações</Button>
        )}
        <Button onClick={test} loading={busy} disabled={devices === 0}>Enviar teste</Button>
      </div>
    </Card>
  );
}
