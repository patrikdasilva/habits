"use client";
import { ArrowLeft, Archive, ArchiveRestore, Flame, Pencil, Target, Trash2, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic, useState } from "react";
import { archiveHabit, removeHabit, setHabitDone, setHabitValue } from "@/lib/actions/habits";
import { formatRelative, weekdayShort } from "@/lib/date";
import { fmtNum } from "@/lib/format";
import type { HabitDetail } from "@/lib/repo/stats";
import type { Category } from "@/lib/types";
import { useCreate } from "./Create";
import { HabitSummary } from "./HabitsList";
import { Heatmap } from "./Heatmap";
import { useUI } from "./Providers";
import { Button, Card, CategoryBadge, CheckCircle, EmptyState, Input, SectionTitle } from "./ui";
import { cx } from "@/lib/cx";

function Stat({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string | number; suffix?: string }) {
  return (
    <Card className="!p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted"><span className="text-accent">{icon}</span>{label}</div>
      <p className="text-2xl font-bold tabular-nums">{value}<span className="ml-1 text-sm font-medium text-muted">{suffix}</span></p>
    </Card>
  );
}

export function HabitDetailView({ detail, category, today }: { detail: HabitDetail; category: Category | null; today: string }) {
  const { habit: h, streak, best, rate30, heat, history, totalDone } = detail;
  const { editHabit } = useCreate();
  const { toast, confirm } = useUI();
  const router = useRouter();
  const [rows, patch] = useOptimistic(history, (s, p: { date: string; value: number; done: boolean }) => s.map((r) => (r.date === p.date ? { ...r, ...p } : r)));
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const toggle = (date: string, done: boolean) =>
    startTransition(async () => {
      patch({ date, value: 0, done });
      const r = await setHabitDone(h.id, date, done);
      if (!r.ok) toast(r.error, "error");
    });
  const saveValue = (date: string) => {
    const n = Number(draft.replace(",", "."));
    setEditing(null);
    if (!Number.isFinite(n) || n < 0) return;
    startTransition(async () => {
      patch({ date, value: n, done: !!h.target && n >= h.target });
      const r = await setHabitValue(h.id, date, n);
      if (!r.ok) toast(r.error, "error");
    });
  };

  async function onArchive() {
    const r = await archiveHabit(h.id, !h.archived);
    if (!r.ok) return toast(r.error, "error");
    toast(h.archived ? "Hábito restaurado" : "Hábito arquivado", "success");
  }
  async function onDelete() {
    const ok = await confirm({ title: "Excluir hábito?", text: `"${h.name}" e todo o histórico serão apagados. Para manter o histórico, arquive em vez de excluir.`, confirmLabel: "Excluir", danger: true });
    if (!ok) return;
    const r = await removeHabit(h.id);
    if (!r.ok) return toast(r.error, "error");
    toast("Hábito excluído", "success");
    router.replace("/habitos");
  }

  return (
    <div>
      <Link href="/habitos" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-text"><ArrowLeft size={16} /> Hábitos</Link>
      <header className="mb-6 flex items-start gap-3.5">
        <CategoryBadge category={category} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight tracking-tight lg:text-3xl">{h.name}</h1>
          <p className="mt-0.5 text-sm text-muted">{category?.name ? `${category.name} · ` : ""}<HabitSummary h={h} /></p>
          {h.description && <p className="mt-1.5 text-sm text-muted">{h.description}</p>}
          {h.archived === 1 && <p className="mt-2 inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">Arquivado</p>}
        </div>
      </header>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Flame size={14} />} label="Sequência atual" value={streak} suffix={streak === 1 ? "dia" : "dias"} />
        <Stat icon={<Trophy size={14} />} label="Melhor sequência" value={best} suffix={best === 1 ? "dia" : "dias"} />
        <Stat icon={<TrendingUp size={14} />} label="Últimos 30 dias" value={rate30 == null ? "—" : `${rate30}%`} />
        <Stat icon={<Target size={14} />} label="Dias concluídos" value={totalDone} />
      </div>

      <div className="grid gap-7 lg:grid-cols-2 lg:items-start">
        <section>
          <SectionTitle>Últimas 12 semanas</SectionTitle>
          <Card><Heatmap cells={heat.map((c) => ({ date: c.date, ratio: c.due || c.ratio > 0 ? c.ratio : null }))} /></Card>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button onClick={() => editHabit(h)}><Pencil size={16} /> Editar</Button>
            <Button onClick={onArchive}>{h.archived ? <><ArchiveRestore size={16} /> Restaurar</> : <><Archive size={16} /> Arquivar</>}</Button>
            <Button variant="danger" onClick={onDelete}><Trash2 size={16} /> Excluir</Button>
          </div>
        </section>

        <section>
          <SectionTitle>Histórico (30 dias)</SectionTitle>
          {rows.length === 0 ? (
            <EmptyState icon={<Target size={22} />} title="Sem dias devidos ainda" text="O histórico aparece a partir da data de início do hábito." />
          ) : (
            <div className="flex flex-col gap-1.5">
              {rows.map((r) => (
                <div key={r.date} className="flex min-h-14 items-center gap-3 rounded-2xl bg-surface px-3 ring-1 ring-surface-2/60">
                  <div className="w-24 shrink-0">
                    <p className="text-sm font-semibold">{formatRelative(r.date, today)}</p>
                    <p className="text-xs text-muted">{r.date === today ? weekdayShort(r.date) : r.date.split("-").reverse().join("/")}</p>
                  </div>
                  {h.type === "check" ? (
                    <>
                      <span className={cx("flex-1 text-sm", r.done ? "text-accent" : "text-muted")}>{r.done ? "Concluído" : "Não feito"}</span>
                      <CheckCircle done={r.done} onClick={() => toggle(r.date, !r.done)} label={`${r.done ? "Desmarcar" : "Marcar"} ${r.date}`} />
                    </>
                  ) : editing === r.date ? (
                    <form className="flex flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); saveValue(r.date); }}>
                      <Input autoFocus inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} className="!min-h-9 flex-1" />
                      <Button size="sm" variant="primary" type="submit">OK</Button>
                    </form>
                  ) : (
                    <button onClick={() => { setEditing(r.date); setDraft(r.value ? String(r.value) : ""); }} className="flex min-h-11 flex-1 items-center justify-end gap-2 text-right" aria-label={`Editar valor de ${r.date}`}>
                      <span className={cx("text-sm tabular-nums", r.done ? "text-accent" : "text-muted")}>{fmtNum(r.value)} / {fmtNum(h.target ?? 0)}{h.unit ? ` ${h.unit}` : ""}</span>
                      <Pencil size={14} className="text-muted" aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
