import "server-only";
import { getDb, query, run } from "@/lib/db/client";
import type { Category } from "@/lib/types";

export const listCategories = () => query<Category>("SELECT id, name, color, icon, sort FROM categories ORDER BY sort, id");

export async function countUsage(): Promise<Record<number, number>> {
  const rows = await query<{ category_id: number; n: number }>(
    `SELECT category_id, COUNT(*) AS n FROM (
       SELECT category_id FROM habits WHERE category_id IS NOT NULL
       UNION ALL SELECT category_id FROM tasks WHERE category_id IS NOT NULL
     ) GROUP BY category_id`,
  );
  return Object.fromEntries(rows.map((r) => [r.category_id, r.n]));
}

export async function createCategory(c: { name: string; color: string; icon: string }) {
  const max = (await query<{ m: number | null }>("SELECT MAX(sort) AS m FROM categories"))[0]?.m ?? -1;
  await run("INSERT INTO categories (name, color, icon, sort) VALUES (?, ?, ?, ?)", [c.name, c.color, c.icon, (max ?? -1) + 1]);
}

export async function updateCategory(id: number, c: { name: string; color: string; icon: string }) {
  await run("UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?", [c.name, c.color, c.icon, id]);
}

/** Itens que usavam a categoria ficam "Sem categoria". */
export async function deleteCategory(id: number) {
  const db = await getDb();
  await db.batch(
    [
      { sql: "UPDATE habits SET category_id = NULL WHERE category_id = ?", args: [id] },
      { sql: "UPDATE tasks SET category_id = NULL WHERE category_id = ?", args: [id] },
      { sql: "DELETE FROM categories WHERE id = ?", args: [id] },
    ],
    "write",
  );
}
