import { listCategories } from "@/lib/repo/categories";
import { listHabits } from "@/lib/repo/habits";
import { HabitsList } from "@/components/HabitsList";

export const metadata = { title: "Hábitos" };

export default async function HabitsPage() {
  const [categories, active, archived] = await Promise.all([listCategories(), listHabits(false), listHabits(true)]);
  return <HabitsList categories={categories} active={active} archived={archived} />;
}
