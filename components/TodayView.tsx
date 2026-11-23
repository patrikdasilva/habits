"use client";
import { CalendarCheck, CircleAlert, ListChecks, Repeat, Sparkles } from "lucide-react";
import Link from "next/link";
import { startTransition, useMemo, useOptimistic, useState } from "react";
import { setHabitDone, setHabitValue } from "@/lib/actions/habits";
import { setTaskDone } from "@/lib/actions/tasks";
import { formatLong, formatRelative } from "@/lib/date";
import { PERIOD_LABEL, PERIOD_ORDER, periodOf, type Period } from "@/lib/schedule";
import type { Category, HabitView, TaskView } from "@/lib/types";
import { useCreate } from "./Create";
import { DayStrip } from "./DayStrip";
import { HabitCard } from "./HabitCard";
import { ProgressRing } from "./ProgressRing";
import { useUI } from "./Providers";
import { TaskItem } from "./TaskItem";
import { Button, Chip, EmptyState, SectionTitle } from "./ui";

type HabitPatch = { id: number; value?: number; done: boolean };
type TaskPatch = { id: number; done: boolean };

export function TodayView({
  date, today, habits, overdue, tasks, categories,
}: { date: string; today: string; habits: HabitView[]; overdue: TaskView[]; tasks: TaskView[]; categories: Category[] }) {
  const { toast } = useUI();
  const { newHabit, newTask } = useCreate();
  const [filter, setFilter] = useState<number | null>(null);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const [oHabits, patchHabit] = useOptimistic(habits, (state, p: HabitPatch) =>
    state.map((h) => {
      if (h.id !== p.id) return h;
      const streak = date === today && p.done !== h.done ? Math.max(0, h.streak + (p.done ? 1 : -1)) : h.streak;
      return { ...h, value: p.value ?? h.value, done: p.done, streak };
    }),
  );
  const [oTasks, patchTask] = useOptimistic([...overdue, ...tasks], (state, p: TaskPatch) => state.map((t) => (t.id === p.id ? { ...t, done: p.done } : t)));

  const fail = (msg: string) => toast(msg, "error");

  function onCheck(h: HabitView) {
    startTransition(async () => {
      patchHabit({ id: h.id, done: !h.done });
      const r = await setHabitDone(h.id, date, !h.done);
      if (!r.ok) fail(r.error);
    });
  }
  function onSetValue(h: HabitView, value: number) {
    const v = Math.max(0, Math.round(value * 1000) / 1000);
    startTransition(async () => {
      patchHabit({ id: h.id, value: v, done: !!h.target && v >= h.target });
      const r = await setHabitValue(h.id, date, v);
      if (!r.ok) fail(r.error);
    });
  }
  function onToggleTask(t: TaskView) {
    startTransition(async () => {
      patchTask({ id: t.id, done: !t.done });
      const r = await setTaskDone(t.id, date, !t.done);
      if (!r.ok) fail(r.error);
    });
  }

  const overdueIds = new Set(overdue.map((t) => t.id));
  const visibleH = oHabits.filter((h) => filter === null || h.category_id === filter);
  const visibleOverdue = oTasks.filter((t) => overdueIds.has(t.id) && (filter === null || t.category_id === filter));
  const visibleT = oTasks
    .filter((t) => !overdueIds.has(t.id) && (filter === null || t.category_id === filter))
    .sort((a, b) => Number(a.done) - Number(b.done));

  const totalAll = oHabits.length + oTasks.filter((t) => !overdueIds.has(t.id)).length;
  const doneAll = oHabits.filter((h) => h.done).length + oTasks.filter((t) => !overdueIds.has(t.id) && t.done).length;
  const ratio = totalAll ? doneAll / totalAll : 0;

  const usedCats = categories.filter((c) => [...oHabits, ...oTasks].some((x) => x.category_id === c.id));
  const grouped = PERIOD_ORDER.map((p) => ({ p, items: visibleH.filter((h) => periodOf(h.time) === p) })).filter((g) => g.items.length);
  const title = formatLong(date);
  const isToday = date === today;
  const nothing = oHabits.length === 0 && oTasks.length === 0;

  return (
    <div>
      <header className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-accent">{isToday ? "Hoje" : formatRelative(date, today)}</p>
          <h1 className="text-2xl font-bold leading-tight tracking-tight first-letter:uppercase lg:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {totalAll ? `${doneAll} de ${totalAll} concluídos` : "Nada agendado para este dia"}
          </p>
          {!isToday && (
            <Link href="/" className="mt-1 inline-block text-sm font-medium text-accent hover:underline">Voltar para hoje</Link>
          )}
        </div>
        <ProgressRing value={ratio} size={88} />
      </header>

      <div className="mb-5"><DayStrip date={date} today={today} /></div>

      {usedCats.length > 1 && (
        <div className="hide-scroll -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={filter === null} onClick={() => setFilter(null)}>Todas</Chip>
          {usedCats.map((c) => (
            <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(filter === c.id ? null : c.id)}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      {nothing ? (
        <EmptyState
          icon={<Sparkles size={24} />}
          title="Dia livre por aqui"
          text="Crie seu primeiro hábito ou tarefa para começar a acompanhar a rotina."
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button variant="primary" onClick={newHabit}>Novo hábito</Button>
              <Button onClick={() => newTask()}>Nova tarefa</Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-7 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          {visibleOverdue.length > 0 && (
            <section className="order-1 lg:order-2 lg:col-start-2">
              <SectionTitle right={<span className="inline-flex items-center gap-1 text-xs font-medium text-accent"><CircleAlert size={13} /> {visibleOverdue.length}</span>}>Atrasadas</SectionTitle>
              <div className="flex flex-col gap-2">
                {visibleOverdue.map((t) => (
                  <TaskItem key={t.id} task={t} category={catMap.get(t.category_id ?? -1)} onToggle={onToggleTask} today={today} />
                ))}
              </div>
            </section>
          )}

          <section className="order-2 lg:order-1 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <SectionTitle right={<span className="text-xs text-muted">{oHabits.filter((h) => h.done).length}/{oHabits.length}</span>}>Hábitos</SectionTitle>
            {grouped.length === 0 ? (
              <EmptyState icon={<Repeat size={22} />} title={oHabits.length ? "Nenhum hábito nesta categoria" : "Sem hábitos neste dia"} text={oHabits.length ? undefined : "Hábitos aparecem aqui nos dias em que se repetem."} action={oHabits.length ? undefined : <Button onClick={newHabit}>Novo hábito</Button>} />
            ) : (
              <div className="flex flex-col gap-5">
                {grouped.map(({ p, items }) => (
                  <div key={p}>
                    <PeriodLabel period={p} />
                    <div className="flex flex-col gap-2.5">
                      {items.map((h) => (
                        <HabitCard key={h.id} habit={h} category={catMap.get(h.category_id ?? -1)} onCheck={onCheck} onSetValue={onSetValue} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="order-3 lg:col-start-2">
            <SectionTitle right={<span className="text-xs text-muted">{oTasks.filter((t) => !overdueIds.has(t.id) && t.done).length}/{oTasks.filter((t) => !overdueIds.has(t.id)).length}</span>}>Tarefas</SectionTitle>
            {visibleT.length === 0 ? (
              <EmptyState icon={<ListChecks size={22} />} title="Nenhuma tarefa para este dia" text="Aproveite, ou adicione algo à lista." action={<Button onClick={() => newTask()}>Nova tarefa</Button>} />
            ) : (
              <div className="flex flex-col gap-2">
                {visibleT.map((t) => (
                  <TaskItem key={t.id} task={t} category={catMap.get(t.category_id ?? -1)} onToggle={onToggleTask} today={today} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function PeriodLabel({ period }: { period: Period }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-1 text-[13px] font-medium text-muted">
      <CalendarCheck size={13} className="text-accent" aria-hidden />
      {PERIOD_LABEL[period]}
    </div>
  );
}
