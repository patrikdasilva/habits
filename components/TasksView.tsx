"use client";
import { CalendarClock, CheckCheck, Inbox, ListChecks, Plus, Repeat } from "lucide-react";
import Link from "next/link";
import { startTransition, useMemo, useOptimistic, type ReactNode } from "react";
import { setTaskDone } from "@/lib/actions/tasks";
import { formatLong, formatRelative } from "@/lib/date";
import { recurrenceLabel } from "@/lib/format";
import type { Category, TaskView } from "@/lib/types";
import { useCreate } from "./Create";
import { useUI } from "./Providers";
import { TaskItem } from "./TaskItem";
import { Button, cx, EmptyState, PageHeader, SectionTitle } from "./ui";

export type TaskTab = "hoje" | "proximas" | "caixa" | "recorrentes" | "concluidas";
type Completed = TaskView & { completedOn: string };

export function TasksView({
  tab, today, categories, overdue, day, upcoming, inbox, recurring, completed,
}: {
  tab: TaskTab;
  today: string;
  categories: Category[];
  overdue: TaskView[];
  day: TaskView[];
  upcoming: { date: string; tasks: TaskView[] }[];
  inbox: TaskView[];
  recurring: TaskView[];
  completed: Completed[];
}) {
  const { newTask } = useCreate();
  const { toast } = useUI();
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  // overrides otimistas por "id|data"
  const [over, setOver] = useOptimistic<Record<string, boolean>, { key: string; done: boolean }>({}, (s, p) => ({ ...s, [p.key]: p.done }));
  const doneOf = (t: TaskView, date: string) => over[`${t.id}|${date}`] ?? t.done;

  function toggle(t: TaskView, date: string) {
    const done = !doneOf(t, date);
    startTransition(async () => {
      setOver({ key: `${t.id}|${date}`, done });
      const r = await setTaskDone(t.id, date, done);
      if (!r.ok) toast(r.error, "error");
    });
  }

  const item = (t: TaskView, date: string, opts?: { showDate?: boolean }) => (
    <TaskItem key={`${t.id}-${date}`} task={{ ...t, done: doneOf(t, date) }} category={catMap.get(t.category_id ?? -1)} onToggle={() => toggle(t, date)} today={today} showDate={opts?.showDate} />
  );

  const tabs: { id: TaskTab; label: string; count?: number }[] = [
    { id: "hoje", label: "Hoje", count: overdue.length + day.filter((t) => !doneOf(t, today)).length },
    { id: "proximas", label: "Próximas" },
    { id: "caixa", label: "Caixa de entrada", count: inbox.length },
    { id: "recorrentes", label: "Recorrentes", count: recurring.length },
    { id: "concluidas", label: "Concluídas" },
  ];

  let body: ReactNode;
  if (tab === "hoje") {
    body =
      overdue.length + day.length === 0 ? (
        <EmptyState icon={<ListChecks size={24} />} title="Nada para hoje" text="Sua lista de hoje está vazia." action={<Button variant="primary" onClick={() => newTask()}>Nova tarefa</Button>} />
      ) : (
        <div className="grid gap-7 lg:grid-cols-2 lg:items-start">
          {overdue.length > 0 && (
            <section>
              <SectionTitle>Atrasadas</SectionTitle>
              <div className="flex flex-col gap-2">{overdue.map((t) => item(t, today))}</div>
            </section>
          )}
          <section>
            <SectionTitle>{formatLong(today)}</SectionTitle>
            <div className="flex flex-col gap-2">{day.length ? day.map((t) => item(t, today)) : <p className="px-1 text-sm text-muted">Nenhuma tarefa para hoje.</p>}</div>
          </section>
        </div>
      );
  } else if (tab === "proximas") {
    const groups = upcoming.filter((g) => g.tasks.length);
    body = groups.length === 0 ? (
      <EmptyState icon={<CalendarClock size={24} />} title="Nada nos próximos 7 dias" text="Tarefas com data e recorrentes aparecem aqui." action={<Button variant="primary" onClick={() => newTask()}>Nova tarefa</Button>} />
    ) : (
      <div className="grid gap-7 lg:grid-cols-2 lg:items-start">
        {groups.map((g) => (
          <section key={g.date}>
            <SectionTitle>{formatRelative(g.date, today)}</SectionTitle>
            <div className="flex flex-col gap-2">{g.tasks.map((t) => item(t, g.date))}</div>
          </section>
        ))}
      </div>
    );
  } else if (tab === "caixa") {
    body = inbox.length === 0 ? (
      <EmptyState icon={<Inbox size={24} />} title="Caixa de entrada vazia" text="Tarefas sem data ficam aqui até você decidir quando fazer." action={<Button variant="primary" onClick={() => newTask({ noDate: true })}>Nova tarefa sem data</Button>} />
    ) : (
      <div className="grid gap-2 lg:grid-cols-2">{inbox.map((t) => item(t, today))}</div>
    );
  } else if (tab === "recorrentes") {
    body = recurring.length === 0 ? (
      <EmptyState icon={<Repeat size={24} />} title="Nenhuma tarefa recorrente" text="Crie tarefas que se repetem: diárias, semanais ou mensais." action={<Button variant="primary" onClick={() => newTask()}>Nova tarefa</Button>} />
    ) : (
      <div className="grid gap-2 lg:grid-cols-2">
        {recurring.map((t) => (
          <TaskItem key={t.id} task={t} category={catMap.get(t.category_id ?? -1)} hideCheck subtitle={recurrenceLabel(t)} />
        ))}
      </div>
    );
  } else {
    body = completed.length === 0 ? (
      <EmptyState icon={<CheckCheck size={24} />} title="Nada concluído ainda" text="As tarefas que você concluir aparecem aqui." />
    ) : (
      <div className="grid gap-2 lg:grid-cols-2">
        {completed.map((t) => (
          <TaskItem
            key={`${t.id}-${t.completedOn}`}
            task={{ ...t, done: doneOf(t, t.completedOn) }}
            category={catMap.get(t.category_id ?? -1)}
            onToggle={() => toggle(t, t.completedOn)}
            today={today}
            subtitle={`Concluída · ${formatRelative(t.completedOn, today)}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Tarefas" right={<Button variant="primary" onClick={() => newTask()}><Plus size={18} strokeWidth={2.6} /> Nova</Button>} />
      <nav aria-label="Abas de tarefas" className="hide-scroll -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === "hoje" ? "/tarefas" : `/tarefas?aba=${t.id}`}
            replace
            aria-current={tab === t.id ? "page" : undefined}
            className={cx(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition active:scale-95",
              tab === t.id ? "bg-accent text-bg" : "bg-surface text-muted hover:text-text",
            )}
          >
            {t.label}
            {t.count ? <span className={cx("rounded-full px-1.5 text-xs font-semibold tabular-nums", tab === t.id ? "bg-bg/20" : "bg-surface-2")}>{t.count}</span> : null}
          </Link>
        ))}
      </nav>
      {body}
    </div>
  );
}
