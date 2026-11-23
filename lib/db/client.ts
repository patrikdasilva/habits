import "server-only";
import { mkdirSync } from "node:fs";
import { createClient, type Client, type ResultSet } from "@libsql/client";
import { SCHEMA } from "./schema";
import { seedCategories } from "./seed";

// Turso em produção (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN); arquivo local em desenvolvimento.
// Tabelas e seed são criados automaticamente na primeira conexão.

const g = globalThis as unknown as { __habitsDb?: Promise<Client> };

export function dbUrl() {
  return process.env.TURSO_DATABASE_URL || "file:./data/habits.db";
}

async function init(): Promise<Client> {
  const url = dbUrl();
  if (url.startsWith("file:")) mkdirSync("data", { recursive: true });
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
  for (const sql of SCHEMA) await db.execute(sql);
  await seedCategories(db);
  return db;
}

export function getDb(): Promise<Client> {
  if (!g.__habitsDb) {
    g.__habitsDb = init().catch((e) => {
      g.__habitsDb = undefined;
      throw e;
    });
  }
  return g.__habitsDb;
}

/** Converte o resultado em objetos simples. */
export function toObjects<T>(rs: ResultSet): T[] {
  return rs.rows.map((row) => {
    const o: Record<string, unknown> = {};
    rs.columns.forEach((c, i) => {
      const v = row[i];
      o[c] = typeof v === "bigint" ? Number(v) : v;
    });
    return o as T;
  });
}

export async function query<T>(sql: string, args: (string | number | null)[] = []): Promise<T[]> {
  const db = await getDb();
  return toObjects<T>(await db.execute({ sql, args }));
}

export async function run(sql: string, args: (string | number | null)[] = []) {
  const db = await getDb();
  return db.execute({ sql, args });
}
