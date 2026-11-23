"use server";
import { redirect } from "next/navigation";
import { authConfigured, checkPassword, endSession, startSession } from "@/lib/server/auth";

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
  await startSession();
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
