import { today } from "@/lib/date";
import { listCategories } from "@/lib/repo/categories";
import { AppShell } from "@/components/AppShell";
import { ConfigProblems } from "@/components/ConfigProblems";
import { diagnose } from "@/lib/server/diagnostics";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { problems } = await diagnose();
  if (problems.length) {
    // Em vez de um erro 500 genérico, mostra o que falta configurar.
    return (
      <main className="mx-auto max-w-lg px-5 py-12 pt-[max(3rem,env(safe-area-inset-top))]">
        <h1 className="mb-4 text-2xl font-bold">Quase lá</h1>
        <ConfigProblems problems={problems} />
      </main>
    );
  }
  const categories = await listCategories();
  return (
    <AppShell categories={categories} today={today()}>
      {children}
    </AppShell>
  );
}
