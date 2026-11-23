import { today } from "@/lib/date";
import { listCategories } from "@/lib/repo/categories";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const categories = await listCategories();
  return (
    <AppShell categories={categories} today={today()}>
      {children}
    </AppShell>
  );
}
