"use client";
import { BellRing, Trash2, X } from "lucide-react";
import { useState } from "react";
import { removeTask, saveTask } from "@/lib/actions/tasks";
import { addDays } from "@/lib/date";
import type { Category, Recurrence, Task, TaskInput } from "@/lib/types";
import { CategoryPicker, DayChips } from "./pickers";
import { useUI } from "./Providers";
import { Button, Chip, Field, Input, Segmented, Textarea, Toggle } from "./ui";
import { weekday } from "@/lib/date";

interface State {
  title: string;
  notes: string;
  category_id: number | null;
  priority: number;
  recurrence: Recurrence;
  days: string;
  month_day: string;
  date: string;
  time: string;
  reminder: boolean;
}

export function TaskForm({ categories, initial, today, defaultNoDate, onDone }: { categories: Category[]; initial?: Task; today: string; defaultNoDate?: boolean; onDone: () => void }) {
  const { toast, confirm } = useUI();
  const [s, setS] = useState<State>(() =>
    initial
      ? {
          title: initial.title, notes: initial.notes, category_id: initial.category_id, priority: initial.priority, recurrence: initial.recurrence,
          days: initial.days ?? String(weekday(today)), month_day: initial.month_day ? String(initial.month_day) : "", date: initial.date ?? "",
          time: initial.time ?? "", reminder: !!initial.reminder,
        }
      : {
          title: "", notes: "", category_id: null, priority: 0, recurrence: "none", days: "12345", month_day: String(Number(today.slice(8))),
          date: defaultNoDate ? "" : today, time: "", reminder: false,
        },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const input: TaskInput = {
      id: initial?.id,
      title: s.title,
      notes: s.notes,
      category_id: s.category_id,
      priority: s.priority,
      recurrence: s.recurrence,
      days: s.recurrence === "weekdays" || s.recurrence === "weekly" ? s.days : null,
      month_day: s.recurrence === "monthly" ? Number(s.month_day) || null : null,
      date: s.recurrence === "none" ? s.date || null : null,
      time: s.time || null,
      reminder: s.reminder && !!s.time,
    };
    const r = await saveTask(input);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast(initial ? "Tarefa atualizada" : "Tarefa criada", "success");
    if (r.warning) toast(r.warning, "info");
    onDone();
  }

  async function remove() {
    if (!initial) return;
    const ok = await confirm({ title: "Excluir tarefa?", text: `"${initial.title}" será apagada com o histórico de conclusões.`, confirmLabel: "Excluir", danger: true });
    if (!ok) return;
    const r = await removeTask(initial.id);
    if (!r.ok) return setError(r.error);
    toast("Tarefa excluída", "success");
    onDone();
  }

  return (
    <form onSubmit={submit} id="task-form" className="space-y-5 pb-2">
      <Field label="Título">
        <Input value={s.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Pagar a conta de luz" maxLength={120} autoFocus={!initial} required />
      </Field>
      <Field label="Notas (opcional)">
        <Textarea value={s.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={1000} />
      </Field>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-muted">Categoria</p>
        <CategoryPicker categories={categories} value={s.category_id} onChange={(v) => set("category_id", v)} />
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-muted">Prioridade</p>
        <Segmented value={s.priority} onChange={(v) => set("priority", v)} options={[{ value: 0, label: "Baixa" }, { value: 1, label: "Média" }, { value: 2, label: "Alta" }]} />
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-muted">Repetição</p>
        <div className="flex flex-wrap gap-2">
          {([["none", "Nenhuma"], ["daily", "Diária"], ["weekdays", "Dias da semana"], ["weekly", "Semanal"], ["monthly", "Mensal"]] as const).map(([v, l]) => (
            <Chip key={v} active={s.recurrence === v} onClick={() => set("recurrence", v)}>{l}</Chip>
          ))}
        </div>
      </div>
      {s.recurrence === "none" && (
        <div>
          <Field label="Data">
            <Input type="date" value={s.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip active={s.date === today} onClick={() => set("date", today)}>Hoje</Chip>
            <Chip active={s.date === addDays(today, 1)} onClick={() => set("date", addDays(today, 1))}>Amanhã</Chip>
            <Chip active={s.date === ""} onClick={() => set("date", "")}>Sem data (caixa de entrada)</Chip>
          </div>
        </div>
      )}
      {s.recurrence === "weekdays" && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-muted">Dias da semana</p>
          <DayChips value={s.days} onChange={(v) => set("days", v)} shortcuts />
        </div>
      )}
      {s.recurrence === "weekly" && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-muted">Dia da semana</p>
          <DayChips value={s.days.slice(0, 1)} onChange={(v) => set("days", v)} single />
        </div>
      )}
      {s.recurrence === "monthly" && (
        <Field label="Dia do mês" hint="Em meses mais curtos, cai no último dia do mês.">
          <Input type="number" inputMode="numeric" min={1} max={31} value={s.month_day} onChange={(e) => set("month_day", e.target.value)} required />
        </Field>
      )}
      <Field label="Horário (opcional)">
        <div className="relative">
          <Input type="time" value={s.time} onChange={(e) => set("time", e.target.value)} className="pr-10" />
          {s.time && (
            <button type="button" aria-label="Limpar horário" onClick={() => setS((p) => ({ ...p, time: "", reminder: false }))} className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-text">
              <X size={16} />
            </button>
          )}
        </div>
      </Field>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2/60 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <BellRing size={18} className="shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium">Lembrete</p>
            <p className="text-xs text-muted">{s.time ? "Notificação no horário da tarefa" : "Defina um horário para ativar"}</p>
          </div>
        </div>
        <Toggle label="Lembrete" checked={s.reminder && !!s.time} disabled={!s.time} onChange={(v) => set("reminder", v)} />
      </div>
      {error && <p role="alert" className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-text ring-1 ring-accent">{error}</p>}
      <Button type="submit" variant="primary" loading={busy} className="w-full">
        {initial ? "Salvar alterações" : "Criar tarefa"}
      </Button>
      {initial && (
        <Button type="button" variant="ghost" className="w-full" onClick={remove}>
          <Trash2 size={16} /> Excluir tarefa
        </Button>
      )}
    </form>
  );
}
