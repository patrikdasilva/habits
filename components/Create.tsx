"use client";
import { CheckSquare, Repeat } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Category, Habit, Task } from "@/lib/types";
import { HabitForm } from "./HabitForm";
import { Sheet } from "./Sheet";
import { TaskForm } from "./TaskForm";

type Mode = { kind: "chooser" } | { kind: "habit"; habit?: Habit } | { kind: "task"; task?: Task; noDate?: boolean };

interface Api {
  openChooser: () => void;
  newHabit: () => void;
  editHabit: (h: Habit) => void;
  newTask: (opts?: { noDate?: boolean }) => void;
  editTask: (t: Task) => void;
}

const Ctx = createContext<Api | null>(null);
export const useCreate = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCreate fora do CreateProvider");
  return c;
};

export function CreateProvider({ categories, today, children }: { categories: Category[]; today: string; children: ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [seq, setSeq] = useState(0);
  const open = useCallback((m: Mode) => { setSeq((n) => n + 1); setMode(m); }, []);
  const api = useMemo<Api>(
    () => ({
      openChooser: () => open({ kind: "chooser" }),
      newHabit: () => open({ kind: "habit" }),
      editHabit: (habit) => open({ kind: "habit", habit }),
      newTask: (o) => open({ kind: "task", noDate: o?.noDate }),
      editTask: (task) => open({ kind: "task", task }),
    }),
    [open],
  );
  const close = useCallback(() => setMode(null), []);
  const title = !mode ? "" : mode.kind === "chooser" ? "Criar novo" : mode.kind === "habit" ? (mode.habit ? "Editar hábito" : "Novo hábito") : mode.task ? "Editar tarefa" : "Nova tarefa";

  return (
    <Ctx.Provider value={api}>
      {children}
      <Sheet open={!!mode} onClose={close} title={title} size={mode?.kind === "chooser" ? "sm" : "md"}>
        {mode?.kind === "chooser" && (
          <div className="grid gap-3 pb-3">
            <button onClick={api.newHabit} className="flex items-center gap-4 rounded-2xl bg-surface-2 p-4 text-left transition hover:brightness-125 active:scale-[0.98]">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-bg"><Repeat size={22} /></span>
              <span><span className="block font-semibold">Novo hábito</span><span className="text-sm text-muted">Repete em dias da semana, com meta</span></span>
            </button>
            <button onClick={() => api.newTask()} className="flex items-center gap-4 rounded-2xl bg-surface-2 p-4 text-left transition hover:brightness-125 active:scale-[0.98]">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-bg"><CheckSquare size={22} /></span>
              <span><span className="block font-semibold">Nova tarefa</span><span className="text-sm text-muted">Avulsa ou recorrente</span></span>
            </button>
          </div>
        )}
        {mode?.kind === "habit" && <HabitForm key={seq} categories={categories} initial={mode.habit} today={today} onDone={close} />}
        {mode?.kind === "task" && <TaskForm key={seq} categories={categories} initial={mode.task} today={today} defaultNoDate={mode.noDate} onDone={close} />}
      </Sheet>
    </Ctx.Provider>
  );
}
