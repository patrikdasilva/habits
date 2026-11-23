import { addDays, today as getToday } from "@/lib/date";
import { listCategories } from "@/lib/repo/categories";
import { taskLists } from "@/lib/repo/tasks";
import { TasksView, type TaskTab } from "@/components/TasksView";

export const metadata = { title: "Tarefas" };

const TABS: TaskTab[] = ["hoje", "proximas", "caixa", "recorrentes", "concluidas"];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const tab = TABS.find((t) => t === aba) ?? "hoje";
  const today = getToday();
  const next = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));
  const [categories, lists] = await Promise.all([listCategories(), taskLists(today, next)]);
  return (
    <TasksView
      tab={tab}
      today={today}
      categories={categories}
      overdue={lists.today.overdue}
      day={lists.today.day}
      upcoming={lists.upcoming}
      inbox={lists.inbox}
      recurring={lists.recurring}
      completed={lists.completed}
    />
  );
}
