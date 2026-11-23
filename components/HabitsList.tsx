"use client";
import { Archive, ChevronRight, Pencil, Plus, Repeat } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { archiveHabit } from "@/lib/actions/habits";
import { targetLabel } from "@/lib/format";
import { daysLabel } from "@/lib/schedule";
import type { Category, Habit } from "@/lib/types";
import { useCreate } from "./Create";
import { useUI } from "./Providers";
import { Button, CategoryBadge, EmptyState, IconButton, PageHeader, SectionTitle } from "./ui";

export function HabitSummary({ h }: { h: Habit }) {
  return <>{[daysLabel(h.days), h.time, targetLabel(h) && `meta ${targetLabel(h)}`].filter(Boolean).join(" · ")}</>;
}

export function HabitsList({ categories, active, archived }: { categories: Category[]; active: Habit[]; archived: Habit[] }) {
  const { newHabit, editHabit } = useCreate();
  const { toast } = useUI();
  const [showArchived, setShowArchived] = useState(false);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const groups: { cat: Category | null; items: Habit[] }[] = [
    ...categories.map((c) => ({ cat: c as Category | null, items: active.filter((h) => h.category_id === c.id) })),
    { cat: null, items: active.filter((h) => h.category_id == null || !catMap.has(h.category_id)) },
  ].filter((g) => g.items.length);

  async function unarchive(h: Habit) {
    const r = await archiveHabit(h.id, false);
    toast(r.ok ? "Hábito restaurado" : r.error, r.ok ? "success" : "error");
  }

  const row = (h: Habit, cat: Category | null, dim?: boolean) => (
    <div key={h.id} className={`flex items-center gap-1 rounded-2xl bg-surface pr-1 ring-1 ring-surface-2/60 ${dim ? "opacity-70" : ""}`}>
      <Link href={`/habitos/${h.id}`} className="flex min-h-[4.25rem] min-w-0 flex-1 items-center gap-3 p-3 transition active:opacity-70">
        <CategoryBadge category={cat} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{h.name}</span>
          <span className="block truncate text-[13px] text-muted"><HabitSummary h={h} /></span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
      </Link>
      {dim ? (
        <Button size="sm" onClick={() => unarchive(h)} className="mr-2">Restaurar</Button>
      ) : (
        <IconButton label={`Editar ${h.name}`} onClick={() => editHabit(h)}><Pencil size={17} /></IconButton>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Hábitos"
        subtitle={active.length ? `${active.length} ${active.length === 1 ? "hábito ativo" : "hábitos ativos"}` : undefined}
        right={<Button variant="primary" onClick={newHabit}><Plus size={18} strokeWidth={2.6} /> Novo</Button>}
      />
      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={<Repeat size={24} />}
          title="Nenhum hábito ainda"
          text="Comece com algo simples: beber água, ler algumas páginas, treinar. Há sugestões prontas no formulário."
          action={<Button variant="primary" onClick={newHabit}>Criar primeiro hábito</Button>}
        />
      ) : (
        <div className="grid gap-7 lg:grid-cols-2 lg:items-start">
          {groups.map((g) => (
            <section key={g.cat?.id ?? "none"}>
              <SectionTitle>{g.cat?.name ?? "Sem categoria"}</SectionTitle>
              <div className="flex flex-col gap-2">{g.items.map((h) => row(h, g.cat))}</div>
            </section>
          ))}
        </div>
      )}
      {archived.length > 0 && (
        <section className="mt-9">
          <button onClick={() => setShowArchived((v) => !v)} className="mb-2.5 flex min-h-11 items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted hover:text-text" aria-expanded={showArchived}>
            <Archive size={14} /> Arquivados ({archived.length})
          </button>
          {showArchived && <div className="grid gap-2 lg:grid-cols-2">{archived.map((h) => row(h, catMap.get(h.category_id ?? -1) ?? null, true))}</div>}
        </section>
      )}
    </div>
  );
}
