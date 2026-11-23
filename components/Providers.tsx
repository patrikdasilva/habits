"use client";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, cx } from "./ui";
import { Sheet } from "./Sheet";

type ToastKind = "info" | "error" | "success";
interface ToastItem {
  id: number;
  text: string;
  kind: ToastKind;
}
interface ConfirmOpts {
  title: string;
  text?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface UI {
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
}

const Ctx = createContext<UI | null>(null);

export function useUI(): UI {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI fora do UIProvider");
  return c;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const seq = useRef(0);

  const toast = useCallback((text: string, kind: ToastKind = "info") => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 5000 : 3000);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirmState({ ...o, resolve })), []);
  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);
  const close = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmState(null);
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 text-sm shadow-xl ring-1",
              t.kind === "error" ? "ring-accent" : "ring-surface-2",
            )}
          >
            {t.kind === "error" ? <AlertCircle size={18} className="mt-0.5 shrink-0 text-accent" /> : t.kind === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" /> : <Info size={18} className="mt-0.5 shrink-0 text-accent" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      <Sheet open={!!confirmState} onClose={() => close(false)} title={confirmState?.title ?? ""} size="sm">
        {confirmState?.text && <p className="text-sm text-muted">{confirmState.text}</p>}
        <div className="mt-5 flex gap-2.5 pb-1">
          <Button className="flex-1" onClick={() => close(false)}>Cancelar</Button>
          <Button className="flex-1" variant={confirmState?.danger ? "danger" : "primary"} onClick={() => close(true)}>
            {confirmState?.confirmLabel ?? "Confirmar"}
          </Button>
        </div>
      </Sheet>
    </Ctx.Provider>
  );
}
