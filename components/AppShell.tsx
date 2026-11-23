"use client";
import { useEffect, type ReactNode } from "react";
import type { Category } from "@/lib/types";
import { BottomNav } from "./BottomNav";
import { CreateProvider } from "./Create";
import { Fab } from "./Fab";
import { UIProvider } from "./Providers";
import { Sidebar } from "./Sidebar";

export function AppShell({ categories, today, children }: { categories: Category[]; today: string; children: ReactNode }) {
  // Service worker: app shell offline + notificações push.
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.active?.postMessage({ type: "warm", build: process.env.NEXT_PUBLIC_BUILD_ID }))
      .catch(() => null);
  }, []);

  return (
    <UIProvider>
      <CreateProvider categories={categories} today={today}>
        <Sidebar />
        <div className="lg:pl-64">
          <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
            {children}
          </main>
        </div>
        <Fab />
        <BottomNav />
      </CreateProvider>
    </UIProvider>
  );
}
