import { countUsage, listCategories } from "@/lib/repo/categories";
import { CategoryManager } from "@/components/CategoryManager";

export const metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const [categories, usage] = await Promise.all([listCategories(), countUsage()]);
  return <CategoryManager categories={categories} usage={usage} />;
}
