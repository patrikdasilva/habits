import type { Client } from "@libsql/client";

export const DEFAULT_CATEGORIES: { name: string; icon: string; color: string }[] = [
  { name: "Academia", icon: "Dumbbell", color: "#f97316" },
  { name: "Trabalho", icon: "Briefcase", color: "#3b82f6" },
  { name: "Leitura", icon: "BookOpen", color: "#a855f7" },
  { name: "Bíblia", icon: "BookHeart", color: "#eab308" },
  { name: "Água", icon: "Droplet", color: "#06b6d4" },
  { name: "Passos", icon: "Footprints", color: "#22c55e" },
  { name: "Sono", icon: "Moon", color: "#6366f1" },
  { name: "Alimentação", icon: "Apple", color: "#ef4444" },
  { name: "Oração/Meditação", icon: "Sparkles", color: "#ec4899" },
  { name: "Estudos", icon: "GraduationCap", color: "#14b8a6" },
  { name: "Finanças", icon: "Wallet", color: "#84cc16" },
  { name: "Casa", icon: "Home", color: "#f59e0b" },
  { name: "Saúde", icon: "HeartPulse", color: "#f43f5e" },
];

/** Insere as categorias padrão se a tabela estiver vazia. Retorna quantas foram inseridas. */
export async function seedCategories(db: Client): Promise<number> {
  const count = Number((await db.execute("SELECT COUNT(*) AS n FROM categories")).rows[0].n);
  if (count > 0) return 0;
  await db.batch(
    DEFAULT_CATEGORIES.map((c, i) => ({
      sql: "INSERT INTO categories (name, color, icon, sort) VALUES (?, ?, ?, ?)",
      args: [c.name, c.color, c.icon, i],
    })),
    "write",
  );
  return DEFAULT_CATEGORIES.length;
}
