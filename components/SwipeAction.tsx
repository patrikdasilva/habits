"use client";
import { Check, Undo2, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import type { ItemStatus } from "@/lib/schedule";
import { cx } from "@/lib/cx";

/**
 * Arraste para a direita = concluir; para a esquerda = "não fiz".
 * Se o item já está no estado daquele lado, o arraste volta para pendente.
 * Só no toque/caneta (no mouse, use a bolinha). Rolagem vertical continua livre.
 */
export function SwipeAction({
  status, onChange, children, className,
}: { status: ItemStatus; onChange: (s: ItemStatus) => void; children: ReactNode; className?: string }) {
  const [dx, setDx] = useState(0);
  const [anim, setAnim] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const g = useRef<{ x: number; y: number; id: number; locked: boolean | null } | null>(null);
  const [limit, setLimit] = useState(100);

  const right: ItemStatus = status === "done" ? "pending" : "done";
  const left: ItemStatus = status === "skipped" ? "pending" : "skipped";
  const target = dx > 0 ? right : left;
  const armed = Math.abs(dx) >= limit;

  const reset = () => {
    setAnim(true);
    setDx(0);
  };

  return (
    <div ref={box} className={cx("relative overflow-hidden rounded-2xl", className)} style={{ touchAction: "pan-y" }}>
      {dx !== 0 && (
        <div
          aria-hidden
          className={cx(
            "pointer-events-none absolute inset-0 flex items-center px-5 text-sm font-semibold transition-colors",
            dx > 0 ? "justify-start" : "justify-end",
            target === "done" ? (armed ? "bg-accent text-bg" : "bg-accent/30 text-text") : armed ? "bg-surface-2 text-text" : "bg-surface-2/60 text-muted",
          )}
        >
          <span className={cx("inline-flex items-center gap-2 transition-transform", armed && "scale-110")}>
            {target === "done" ? <Check size={20} strokeWidth={3} /> : target === "skipped" ? <X size={20} strokeWidth={3} /> : <Undo2 size={18} />}
            {target === "done" ? "Concluir" : target === "skipped" ? "Não fiz" : "Pendente"}
          </span>
        </div>
      )}
      <div
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: anim ? "transform 0.2s ease-out" : undefined }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          g.current = { x: e.clientX, y: e.clientY, id: e.pointerId, locked: null };
          setLimit(Math.min(110, (box.current?.offsetWidth ?? 320) * 0.3));
          setAnim(false);
        }}
        onPointerMove={(e) => {
          const s = g.current;
          if (!s || s.id !== e.pointerId) return;
          const mx = e.clientX - s.x;
          const my = e.clientY - s.y;
          if (s.locked == null && (Math.abs(mx) > 10 || Math.abs(my) > 10)) s.locked = Math.abs(mx) > Math.abs(my) * 1.4;
          if (s.locked) {
            // resistência depois do limite
            const t = limit;
            const ax = Math.abs(mx);
            setDx(Math.sign(mx) * (ax <= t ? ax : t + (ax - t) * 0.35));
          }
        }}
        onPointerUp={() => {
          const s = g.current;
          g.current = null;
          if (!s?.locked) return;
          if (armed) {
            if (navigator.vibrate) navigator.vibrate(12);
            onChange(target);
          }
          reset();
        }}
        onPointerCancel={() => {
          g.current = null;
          reset();
        }}
        onClickCapture={(e) => {
          // um arraste não vira toque no botão/link embaixo do dedo
          if (dx) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
