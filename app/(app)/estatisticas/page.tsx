import { BarChart3, CheckCheck, Flame, Target } from "lucide-react";
import Link from "next/link";
import { addDays, today as getToday, startOfWeek } from "@/lib/date";
import { listCategories } from "@/lib/repo/categories";
import { getStats } from "@/lib/repo/stats";
import { cx } from "@/lib/cx";
import { CategoryBadge, Card, EmptyState, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";
import { Heatmap } from "@/components/Heatmap";
import { ProgressRing } from "@/components/ProgressRing";

export const metadata = { title: "Estatísticas" };

const PERIODS = [7, 30, 90];

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias } = await searchParams;
  const days = PERIODS.includes(Number(dias)) ? Number(dias) : 30;
  const today = getToday();
  const [stats, categories] = await Promise.all([getStats(days, today), listCategories()]);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const pct = stats.due ? stats.done / stats.due : 0;

  // alinha o heatmap a domingo (células anteriores ao período ficam vazias)
  const first = startOfWeek(stats.from);
  const byDate = new Map(stats.cells.map((c) => [c.date, c]));
  const heat: { date: string; ratio: number | null }[] = [];
  for (let d = first; d <= addDays(startOfWeek(today), 6); d = addDays(d, 1)) {
    const c = byDate.get(d);
    heat.push({ date: d, ratio: c && c.due > 0 ? c.done / c.due : null });
  }

  return (
    <div>
      <PageHeader title="Estatísticas" subtitle={`Últimos ${days} dias`} />
      <nav aria-label="Período" className="mb-6 inline-flex rounded-xl bg-surface p-1">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={p === 30 ? "/estatisticas" : `/estatisticas?dias=${p}`}
            replace
            aria-current={p === days ? "page" : undefined}
            className={cx("flex min-h-10 min-w-20 items-center justify-center rounded-lg px-4 text-sm font-semibold transition", p === days ? "bg-accent text-bg" : "text-muted hover:text-text")}
          >
            {p} dias
          </Link>
        ))}
      </nav>

      {stats.due === 0 ? (
        <EmptyState icon={<BarChart3 size={24} />} title="Ainda sem dados" text="Crie hábitos e tarefas e marque o que fizer. As estatísticas aparecem aqui." />
      ) : (
        <div className="space-y-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="flex items-center gap-4">
              <ProgressRing value={pct} size={76} stroke={8} />
              <div>
                <p className="text-xs font-medium text-muted">Conclusão geral</p>
                <p className="text-sm text-muted">{stats.done} de {stats.due} itens</p>
              </div>
            </Card>
            <Card>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted"><Target size={14} className="text-accent" /> Hábitos e tarefas feitos</p>
              <p className="text-3xl font-bold tabular-nums">{stats.done}</p>
            </Card>
            <Card>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted"><CheckCheck size={14} className="text-accent" /> Tarefas concluídas</p>
              <p className="text-3xl font-bold tabular-nums">{stats.tasksCompleted}</p>
            </Card>
          </div>

          <section>
            <SectionTitle>Dia a dia</SectionTitle>
            <Card><Heatmap cells={heat} maxCell={44} /></Card>
          </section>

          <div className="grid gap-7 lg:grid-cols-2 lg:items-start">
            <section>
              <SectionTitle>Por categoria</SectionTitle>
              <Card className="space-y-4">
                {stats.byCategory.map((c) => {
                  const cat = c.category_id ? catMap.get(c.category_id) : undefined;
                  const r = c.due ? c.done / c.due : 0;
                  return (
                    <div key={c.category_id ?? "none"}>
                      <div className="mb-1.5 flex items-center gap-2.5">
                        <CategoryBadge category={cat} size={28} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{cat?.name ?? "Sem categoria"}</span>
                        <span className="text-sm tabular-nums text-muted">{Math.round(r * 100)}% · {c.done}/{c.due}</span>
                      </div>
                      <ProgressBar value={r} />
                    </div>
                  );
                })}
              </Card>
            </section>

            <section>
              <SectionTitle>Por hábito</SectionTitle>
              {stats.byHabit.length === 0 ? (
                <Card><p className="text-sm text-muted">Nenhum hábito no período.</p></Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {stats.byHabit.map((h) => (
                    <Link key={h.id} href={`/habitos/${h.id}`} className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-surface-2/60 transition active:opacity-70">
                      <CategoryBadge category={catMap.get(h.category_id ?? -1)} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{h.name}</p>
                        <ProgressBar value={h.due ? h.done / h.due : 0} className="mt-1.5 !h-1.5" />
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums">{Math.round((h.done / (h.due || 1)) * 100)}%</p>
                        <p className="inline-flex items-center gap-0.5 text-xs text-muted"><Flame size={11} className="text-accent" />{h.streak} · melhor {h.best}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
