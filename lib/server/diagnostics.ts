import "server-only";
import { authSecret } from "./session";
import { dbUrl, getDb } from "@/lib/db/client";

// Diagnóstico de configuração: só nomes de variáveis e o tipo de erro, nunca valores.

export interface Diagnosis {
  problems: string[];
}

/** Erro do banco em texto curto e sem segredos (código + primeira linha). */
export function describeDbError(e: unknown): string {
  const err = e as { code?: string; message?: string; cause?: { message?: string; code?: string; cause?: { code?: string } } };
  const cause = [err?.cause?.code, err?.cause?.cause?.code, err?.cause?.message].filter(Boolean).join(" ");
  const msg = `${String(err?.message ?? err ?? "erro desconhecido").split("\n")[0]} ${cause}`.trim().replace(/libsql:\/\/\S+/g, "libsql://…");
  if (/401|unauthori[sz]ed|jwt|token/i.test(msg))
    return "o Turso recusou o acesso: confira TURSO_AUTH_TOKEN (token ausente, de outro banco ou expirado).";
  if (/ENOTFOUND|getaddrinfo|404/i.test(msg)) return "o endereço do banco não foi encontrado: confira TURSO_DATABASE_URL.";
  if (/EROFS|read-only|EACCES|mkdir/i.test(msg))
    return "TURSO_DATABASE_URL não está disponível neste deploy e o servidor não pode gravar o arquivo local. Defina a variável e faça redeploy.";
  return `${err?.code ? `${err.code}: ` : ""}${msg}`.slice(0, 240);
}

export function configProblems(): string[] {
  const p: string[] = [];
  if (process.env.NODE_ENV === "production") {
    if (!process.env.APP_PASSWORD) p.push("APP_PASSWORD não definida.");
    if (!authSecret()) p.push("AUTH_SECRET ausente ou com menos de 32 caracteres (gere com: openssl rand -base64 32).");
    const url = dbUrl();
    // Na Vercel o disco é efêmero: precisa do Turso. Num servidor próprio, arquivo local é válido.
    if (url.startsWith("file:") && process.env.VERCEL) p.push("TURSO_DATABASE_URL não definida neste deploy.");
    else if (url.startsWith("libsql:") && !process.env.TURSO_AUTH_TOKEN) p.push("TURSO_AUTH_TOKEN não definida.");
  }
  return p;
}

export async function diagnose(): Promise<Diagnosis> {
  const problems = configProblems();
  try {
    await getDb();
  } catch (e) {
    console.error("[habits] falha ao conectar no banco", e);
    problems.push(`Banco: ${describeDbError(e)}`);
  }
  return { problems };
}
