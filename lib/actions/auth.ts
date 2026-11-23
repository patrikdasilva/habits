"use server";
import { redirect } from "next/navigation";
import { authConfigured, checkPassword, endSession, startSession } from "@/lib/server/auth";
import { authSecret } from "@/lib/server/session";

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!authConfigured()) return { error: "Servidor sem APP_PASSWORD configurada." };
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 1000)); // freia tentativas em força bruta
    return { error: "Senha incorreta." };
  }
  if (!authSecret()) return { error: "Servidor sem AUTH_SECRET (mínimo 32 caracteres). Configure na Vercel e faça redeploy." };
  try {
    await startSession();
  } catch (e) {
    console.error("[habits] falha ao criar a sessão", e);
    return { error: "Não foi possível criar a sessão. Veja os logs da Vercel." };
  }
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
