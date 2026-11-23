"use client";
import { BellRing, X } from "lucide-react";
import { useState } from "react";
import { saveHabit } from "@/lib/actions/habits";
import { HABIT_SUGGESTIONS } from "@/lib/suggestions";
import type { Category, Habit, HabitInput } from "@/lib/types";
import { CategoryPicker, DayChips } from "./pickers";
import { useUI } from "./Providers";
import { Button, Chip, Field, Input, Segmented, Textarea, Toggle } from "./ui";

interface State {
  name: string;
  description: string;
  category_id: number | null;
  type: "check" | "quantity";
  target: string;
  unit: string;
  step: string;
  days: string;
  time: string;
  reminder: boolean;
  start_date: string;
}

const blank = (today: string): State => ({
  name: "", description: "", category_id: null, type: "check", target: "", unit: "", step: "", days: "0123456", time: "", reminder: false, start_date: today,
});

const fromHabit = (h: Habit): State => ({
  name: h.name, description: h.description, category_id: h.category_id, type: h.type,
  target: h.target != null ? String(h.target) : "", unit: h.unit ?? "", step: h.step != null ? String(h.step) : "",
  days: h.days, time: h.time ?? "", reminder: !!h.reminder, start_date: h.start_date,
});

export function HabitForm({ categories, initial, today, onDone }: { categories: Category[]; initial?: Habit; today: string; onDone: () => void }) {
  const { toast } = useUI();
  const [s, setS] = useState<State>(() => (initial ? fromHabit(initial) : blank(today)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  function applySuggestion(i: number) {
    const sg = HABIT_SUGGESTIONS[i];
    const cat = categories.find((c) => c.name === sg.category);
    setS((p) => ({
      ...p,
      name: sg.name,
      category_id: cat?.id ?? null,
      type: sg.type,
      target: sg.target != null ? String(sg.target) : "",
      unit: sg.unit ?? "",
      step: sg.step != null ? String(sg.step) : "",
      days: sg.days ?? "0123456",
      time: sg.time ?? "",
      reminder: false,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const input: HabitInput = {
      id: initial?.id,
      name: s.name,
      description: s.description,
      category_id: s.category_id,
      type: s.type,
      target: s.type === "quantity" ? Number(s.target.replace(",", ".")) || null : null,
      unit: s.type === "quantity" ? s.unit || null : null,
      step: s.type === "quantity" ? Number(s.step.replace(",", ".")) || null : null,
      days: s.days,
      time: s.time || null,
      reminder: s.reminder && !!s.time,
      start_date: s.start_date,
    };
    const r = await saveHabit(input);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast(initial ? "Hábito atualizado" : "Hábito criado", "success");
    if (r.warning) toast(r.warning, "info");
    onDone();
  }

  return (
    <form onSubmit={submit} id="habit-form" className="space-y-5 pb-2">
      {!initial && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-muted">Sugestões rápidas</p>
          <div className="hide-scroll -mx-5 flex gap-2 overflow-x-auto px-5">
            {HABIT_SUGGESTIONS.map((sg, i) => (
              <Chip key={sg.label} onClick={() => applySuggestion(i)} className="whitespace-nowrap">
                {sg.label}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <Field label="Nome">
        <Input value={s.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Beber água" maxLength={80} autoFocus={!initial} required />
      </Field>
      <Field label="Descrição (opcional)">
        <Textarea value={s.description} onChange={(e) => set("description", e.target.value)} rows={2} maxLength={300} />
      </Field>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-muted">Categoria</p>
        <CategoryPicker categories={categories} value={s.category_id} onChange={(v) => set("category_id", v)} />
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-muted">Tipo</p>
        <Segmented
          value={s.type}
          onChange={(v) => set("type", v)}
          options={[{ value: "check", label: "Feito / não feito" }, { value: "quantity", label: "Quantidade" }]}
        />
      </div>
      {s.type === "quantity" && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Meta diária">
            <Input inputMode="decimal" value={s.target} onChange={(e) => set("target", e.target.value)} placeholder="3000" required />
          </Field>
          <Field label="Unidade">
            <Input value={s.unit} onChange={(e) => set("unit", e.target.value)} placeholder="ml" maxLength={20} />
          </Field>
          <Field label="Incremento">
            <Input inputMode="decimal" value={s.step} onChange={(e) => set("step", e.target.value)} placeholder="250" />
          </Field>
        </div>
      )}
      <div>
        <p className="mb-2 text-[13px] font-medium text-muted">Dias da semana</p>
        <DayChips value={s.days} onChange={(v) => set("days", v)} shortcuts />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
        <Field label="Começa em">
          <Input type="date" value={s.start_date} onChange={(e) => set("start_date", e.target.value)} required />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2/60 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <BellRing size={18} className="shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium">Lembrete</p>
            <p className="text-xs text-muted">{s.time ? "Notificação no horário do hábito" : "Defina um horário para ativar"}</p>
          </div>
        </div>
        <Toggle label="Lembrete" checked={s.reminder && !!s.time} disabled={!s.time} onChange={(v) => set("reminder", v)} />
      </div>
      {error && <p role="alert" className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-text ring-1 ring-accent">{error}</p>}
      <Button type="submit" variant="primary" loading={busy} className="w-full">
        {initial ? "Salvar alterações" : "Criar hábito"}
      </Button>
    </form>
  );
}
