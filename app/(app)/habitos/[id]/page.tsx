import { notFound } from "next/navigation";
import { today as getToday } from "@/lib/date";
import { listCategories } from "@/lib/repo/categories";
import { getHabit } from "@/lib/repo/habits";
import { getHabitDetail } from "@/lib/repo/stats";
import { HabitDetailView } from "@/components/HabitDetailView";

export const metadata = { title: "Hábito" };

export default async function HabitPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const habit = await getHabit(id);
  if (!habit) notFound();
  const today = getToday();
  const [detail, categories] = await Promise.all([getHabitDetail(habit, today), listCategories()]);
  return <HabitDetailView detail={detail} category={categories.find((c) => c.id === habit.category_id) ?? null} today={today} />;
}
