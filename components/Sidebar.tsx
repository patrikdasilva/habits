"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCreate } from "./Create";
import { cx } from "./ui";
import { NAV } from "./nav";

export function Sidebar() {
  const path = usePathname();
  const { openChooser } = useCreate();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-surface-2 bg-surface px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="size-9 rounded-xl" />
        <div>
          <p className="font-bold leading-tight">Hábitos</p>
          <p className="text-xs text-muted">& Tarefas</p>
        </div>
      </div>
      <button
        onClick={openChooser}
        className="mb-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 font-semibold text-bg transition hover:brightness-110 active:scale-[0.98]"
      >
        <Plus size={18} strokeWidth={2.6} aria-hidden /> Novo
      </button>
      <nav aria-label="Principal" className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const on = match(path);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cx(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition",
                on ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2/60 hover:text-text",
              )}
            >
              <Icon size={19} className={on ? "text-accent" : ""} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
