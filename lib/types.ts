export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  sort: number;
}

export type HabitType = "check" | "quantity";

export interface Habit {
  id: number;
  name: string;
  description: string;
  category_id: number | null;
  type: HabitType;
  target: number | null;
  unit: string | null;
  step: number | null;
  days: string;
  time: string | null;
  reminder: number;
  reminder_schedule_ids: string | null;
  start_date: string;
  archived: number;
  sort: number;
}

export type Recurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export interface Task {
  id: number;
  title: string;
  notes: string;
  category_id: number | null;
  priority: number; // 0 baixa, 1 média, 2 alta
  recurrence: Recurrence;
  days: string | null;
  month_day: number | null;
  date: string | null;
  time: string | null;
  reminder: number;
  reminder_schedule_ids: string | null;
  start_date: string;
  end_date: string | null;
  archived: number;
}

/** Hábito com o estado do dia (serializável para o cliente). */
export interface HabitView extends Habit {
  value: number;
  done: boolean;
  streak: number;
  best: number;
}

export interface TaskView extends Task {
  done: boolean;
  overdue: boolean;
}

export interface HabitInput {
  id?: number;
  name: string;
  description: string;
  category_id: number | null;
  type: HabitType;
  target: number | null;
  unit: string | null;
  step: number | null;
  days: string;
  time: string | null;
  reminder: boolean;
  start_date: string;
}

export interface TaskInput {
  id?: number;
  title: string;
  notes: string;
  category_id: number | null;
  priority: number;
  recurrence: Recurrence;
  days: string | null;
  month_day: number | null;
  date: string | null;
  time: string | null;
  reminder: boolean;
}

export const PRIORITY_LABEL = ["Baixa", "Média", "Alta"] as const;
