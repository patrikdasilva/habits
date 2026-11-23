import { ChevronRight, Download, Tags } from "lucide-react";
import Link from "next/link";
import { query } from "@/lib/db/client";
import { pushConfig } from "@/lib/server/push";
import { InstallGuide } from "@/components/InstallGuide";
import { Notifications } from "@/components/Notifications";
import { SignOutButton } from "@/components/SignOutButton";
import { Card, PageHeader, SectionTitle } from "@/components/ui";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const cfg = pushConfig();
  const subs = Number((await query<{ n: number }>("SELECT COUNT(*) AS n FROM push_subscriptions"))[0]?.n ?? 0);
  return (
    <div className="mx-auto max-w-2xl lg:mx-0">
      <PageHeader title="Ajustes" />
      <div className="space-y-7">
        <section>
          <SectionTitle>Notificações</SectionTitle>
          <Notifications ok={cfg.ok} missing={cfg.missing} publicKey={cfg.publicKey ?? null} devices={subs} />
        </section>

        <section>
          <SectionTitle>Organização</SectionTitle>
          <Link href="/categorias" className="flex min-h-16 items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-surface-2/60 transition active:opacity-70">
            <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-accent"><Tags size={19} /></span>
            <span className="flex-1"><span className="block font-semibold">Categorias</span><span className="text-sm text-muted">Nome, cor e ícone</span></span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        </section>

        <section>
          <SectionTitle>Instalar o app</SectionTitle>
          <InstallGuide />
        </section>

        <section>
          <SectionTitle>Dados</SectionTitle>
          <Card className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-accent"><Download size={19} /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold">Exportar backup</p><p className="text-sm text-muted">Baixa tudo em um arquivo JSON.</p></div>
            <a href="/api/backup" download className="inline-flex min-h-11 items-center rounded-xl bg-surface-2 px-4 text-[15px] font-semibold transition hover:brightness-125 active:scale-[0.97]">Baixar</a>
          </Card>
        </section>

        <section>
          <SignOutButton />
        </section>
      </div>
    </div>
  );
}
