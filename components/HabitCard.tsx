"use client";
import { Flame, Minus, Pencil, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { fmtNum, targetLabel } from "@/lib/format";
import type { ItemStatus } from "@/lib/schedule";
import type { Category, HabitView } from "@/lib/types";
import { Sheet } from "./Sheet";
import { SwipeAction } from "./SwipeAction";
import { Button, CategoryBadge, CheckCircle, Input, ProgressBar } from "./ui";
import { cx } from "@/lib/cx";

export function HabitCard({
  habit: h, category, onStatus, onSetValue,
}: {
  habit: HabitView;
  category?: Category;
  onStatus: (h: HabitView, s: ItemStatus) => void;
  onSetValue: (h: HabitView, value: number) => void;
}) {
  const status: ItemStatus = h.done ? "done" : h.skipped ? "skipped" : "pending";
  const [entry, setEntry] = useState<string | null>(null);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step = h.step && h.step > 0 ? h.step : 1;
  const pct = h.target ? h.value / h.target : 0;
  const unit = h.unit ? ` ${h.unit}` : "";

  const startPress = () => {
    press.current = setTimeout(() => { press.current = null; setEntry(String(h.value || "")); }, 500);
  };
  const endPress = () => {
    if (press.current) clearTimeout(press.current);
    press.current = null;
  };

  return (
    <SwipeAction status={status} onChange={(s) => onStatus(h, s)}>
    <div className={cx("rounded-2xl bg-surface p-3.5 ring-1 ring-inset transition-colors", h.done ? "ring-accent/50" : "ring-surface-2/60")}>
      <div className={cx("transition-opacity", h.skipped && "opacity-55")}>
      <div className="flex items-center gap-3">
        <CategoryBadge category={category} />
        <div className="min-w-0 flex-1">
          <Link href={`/habitos/${h.id}`} className={cx("block truncate font-semibold leading-snug hover:underline", h.skipped && "line-through decoration-muted/60")}>{h.name}</Link>
          <p className="flex min-w-0 flex-wrap items-center gap-x-2.5 text-[13px] text-muted">
            {h.skipped && (
              <span className="inline-flex items-center gap-0.5 font-medium"><X size={12} strokeWidth={3} aria-hidden /> Não fiz</span>
            )}
            {h.time && <span className="tabular-nums">{h.time}</span>}
            {h.type === "quantity" && <span>meta {targetLabel(h)}</span>}
            {h.streak > 0 && (
              <span className="inline-flex items-center gap-0.5 font-medium text-accent" title="Sequência atual">
                <Flame size={13} aria-hidden /> {h.streak}
              </span>
            )}
          </p>
        </div>
        <CheckCircle
          done={h.done}
          skipped={h.skipped}
          onClick={() => onStatus(h, status === "pending" ? "done" : "pending")}
          label={status === "pending" ? `Concluir ${h.name}` : `Voltar ${h.name} para pendente`}
          size={48}
        />
      </div>
      {h.type === "quantity" && (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onPointerDown={startPress}
              onPointerUp={endPress}
              onPointerLeave={endPress}
              onPointerCancel={endPress}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => setEntry(String(h.value || ""))}
              className="flex min-h-9 select-none items-baseline gap-1 rounded-lg text-left"
              aria-label="Digitar valor exato"
            >
              <span className="text-xl font-bold tabular-nums">{fmtNum(h.value)}</span>
              <span className="text-sm text-muted">/ {fmtNum(h.target ?? 0)}{unit}</span>
              <Pencil size={13} className="ml-1 self-center text-muted" aria-hidden />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetValue(h, Math.max(0, h.value - step))}
                disabled={h.value <= 0}
                aria-label={`Diminuir ${fmtNum(step)}`}
                className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl bg-surface-2 px-2.5 text-sm font-semibold transition active:scale-90 disabled:opacity-40"
              >
                <Minus size={16} aria-hidden />{fmtNum(step)}
              </button>
              <button
                type="button"
                onClick={() => onSetValue(h, h.value + step)}
                aria-label={`Aumentar ${fmtNum(step)}`}
                className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl bg-accent px-3 text-sm font-bold text-bg transition active:scale-90"
              >
                <Plus size={16} strokeWidth={3} aria-hidden />{fmtNum(step)}
              </button>
            </div>
          </div>
          <ProgressBar value={pct} />
        </div>
      )}
      </div>
      <Sheet open={entry !== null} onClose={() => setEntry(null)} title={h.name} size="sm">
        <form
          className="space-y-4 pb-1"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number((entry ?? "").replace(",", "."));
            if (Number.isFinite(n) && n >= 0) onSetValue(h, n);
            setEntry(null);
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-muted">Valor de hoje{unit ? ` (${h.unit})` : ""}</span>
            <Input autoFocus inputMode="decimal" value={entry ?? ""} onChange={(e) => setEntry(e.target.value)} placeholder="0" />
          </label>
          <Button type="submit" variant="primary" className="w-full">Salvar valor</Button>
        </form>
      </Sheet>
    </div>
    </SwipeAction>
  );
}
