import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

let warned = false;

/** APP_PASSWORD; em desenvolvimento sem a variável, a senha padrão é "habitos". */
function expectedPassword(): string | null {
  if (process.env.APP_PASSWORD) return process.env.APP_PASSWORD;
  if (process.env.NODE_ENV !== "production") {
    if (!warned) {
      console.warn('[habits] APP_PASSWORD não definida: usando a senha padrão "habitos" (apenas em desenvolvimento).');
      warned = true;
    }
    return "habitos";
  }
  return null;
}

const sha = (s: string) => createHash("sha256").update(s).digest();

/** Comparação em tempo constante (compara os hashes SHA-256). */
export function checkPassword(input: string): boolean {
  const expected = expectedPassword();
  if (!expected) return false;
  return timingSafeEqual(sha(input), sha(expected));
}

export const authConfigured = () => expectedPassword() !== null;

export async function startSession() {
  const token = await signSession();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAuthenticated() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}
