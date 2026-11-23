import { LoginForm } from "./LoginForm";
import { ConfigProblems } from "@/components/ConfigProblems";
import { diagnose } from "@/lib/server/diagnostics";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { problems } = await diagnose();
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="mb-5 size-20 rounded-[1.4rem] shadow-[0_12px_40px_rgba(0,0,0,0.4)]" />
          <h1 className="text-3xl font-bold tracking-tight">Hábitos</h1>
          <p className="mt-1.5 text-muted">Sua rotina, um dia de cada vez.</p>
        </div>
        <ConfigProblems problems={problems} />
        <LoginForm />
      </div>
    </main>
  );
}
