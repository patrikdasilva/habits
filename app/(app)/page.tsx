import { isDate, today as getToday } from "@/lib/date";
import { listCategories } from "@/lib/repo/categories";
import { habitViewsForDate } from "@/lib/repo/habits";
import { taskViewsForDate } from "@/lib/repo/tasks";
import { TodayView } from "@/components/TodayView";

export const metadata = { title: "Hoje" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const today = getToday();
  const date = isDate(d) ? d : today;
  const [categories, habits, tasks] = await Promise.all([listCategories(), habitViewsForDate(date, today), taskViewsForDate(date, today)]);
  return <TodayView key={date} date={date} today={today} habits={habits} overdue={tasks.overdue} tasks={tasks.day} categories={categories} />;
}
