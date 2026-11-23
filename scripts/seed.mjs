// Cria o banco local (data/habits.db ou TURSO_DATABASE_URL) e insere as categorias padrão.
// Uso: npm run db:seed
import { mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";
import { SCHEMA } from "../lib/db/schema.ts";
import { seedCategories } from "../lib/db/seed.ts";

const url = process.env.TURSO_DATABASE_URL || "file:./data/habits.db";
if (url.startsWith("file:")) mkdirSync("data", { recursive: true });
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
for (const sql of SCHEMA) await db.execute(sql);
const n = await seedCategories(db);
const total = (await db.execute("SELECT COUNT(*) AS n FROM categories")).rows[0].n;
console.log(n ? `${n} categorias inseridas.` : "Categorias já existiam.", `Total: ${total}.`);
