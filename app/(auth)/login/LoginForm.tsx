"use client";
import { Lock } from "lucide-react";
import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";
import { Button, Input } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4 rounded-3xl bg-surface p-5 ring-1 ring-surface-2/60">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-muted">Senha</span>
        <div className="relative">
          <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input name="password" type="password" autoComplete="current-password" autoFocus required className="pl-10" placeholder="Digite sua senha" />
        </div>
      </label>
      {state.error && <p role="alert" className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm ring-1 ring-accent">{state.error}</p>}
      <Button type="submit" variant="primary" loading={pending} className="w-full">Entrar</Button>
    </form>
  );
}
