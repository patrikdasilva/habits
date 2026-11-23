"use client";
import { Plus } from "lucide-react";
import { useCreate } from "./Create";

export function Fab() {
  const { openChooser } = useCreate();
  return (
    <button
      onClick={openChooser}
      aria-label="Criar novo hábito ou tarefa"
      className="fixed right-4 z-40 flex size-14 items-center justify-center rounded-2xl bg-accent text-bg shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition hover:brightness-110 active:scale-90 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <Plus size={26} strokeWidth={2.6} aria-hidden />
    </button>
  );
}
