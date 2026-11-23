// JWT de sessão (HS256). Usado pelo proxy.ts e pelas server actions.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 90;

const DEV_SECRET = "habitos-dev-secret-nao-use-em-producao-0123456789";

export function authSecret(): string | null {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== "production") return DEV_SECRET;
  return null;
}

const key = () => {
  const s = authSecret();
  return s ? new TextEncoder().encode(s) : null;
};

export async function signSession(): Promise<string> {
  const k = key();
  if (!k) throw new Error("AUTH_SECRET ausente ou com menos de 32 caracteres");
  return new SignJWT({ u: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(k);
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  const k = key();
  if (!token || !k) return false;
  try {
    await jwtVerify(token, k, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
