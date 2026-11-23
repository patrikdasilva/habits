"use client";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cx, IconButton } from "./ui";

/** Bottom sheet no mobile, modal centrado no desktop (lg+). */
export function Sheet({
  open, onClose, title, children, footer, size = "md",
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cx(
          "relative flex max-h-[92dvh] w-full animate-sheet-up flex-col rounded-t-3xl bg-surface shadow-2xl ring-1 ring-surface-2 lg:animate-pop-in lg:rounded-3xl",
          size === "md" ? "lg:max-w-lg" : "lg:max-w-sm",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-surface-2 lg:hidden" />
        <div className="flex shrink-0 items-center justify-between gap-2 px-5 pb-1 pt-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <IconButton label="Fechar" onClick={onClose} className="-mr-2">
            <X size={20} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">{children}</div>
        {footer && <div className="shrink-0 border-t border-surface-2 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
