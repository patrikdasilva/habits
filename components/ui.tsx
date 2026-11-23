"use client";
import { Check, Loader2, X } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { CategoryIcon } from "./icons";
import type { Category } from "@/lib/types";


type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  loading?: boolean;
};

export function Button({ variant = "secondary", size = "md", loading, className, children, disabled, ...p }: BtnProps) {
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
        size === "md" ? "min-h-11 px-4 text-[15px]" : "min-h-9 px-3 text-sm",
        variant === "primary" && "bg-accent text-bg hover:brightness-110",
        variant === "secondary" && "bg-surface-2 text-text hover:brightness-125",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-text",
        variant === "danger" && "bg-surface-2 text-text ring-1 ring-inset ring-accent/40 hover:bg-accent hover:text-bg",
        className,
      )}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...p}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text active:scale-95 disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

const fieldCls =
  "w-full min-w-0 rounded-xl bg-surface-2 px-3.5 min-h-11 text-base text-text placeholder:text-muted/60 outline-none ring-1 ring-transparent transition focus:ring-accent";

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(fieldCls, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(fieldCls, "py-2.5 resize-none", p.className)} />
);
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(fieldCls, p.className)} />;

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted/70">{hint}</span>}
    </label>
  );
}

export function Chip({ active, children, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...p}
      className={cx(
        "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition active:scale-95",
        active ? "bg-accent text-bg" : "bg-surface-2 text-muted hover:text-text",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value, onChange, options, className,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div className={cx("flex rounded-xl bg-surface-2 p-1", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-9 flex-1 rounded-lg px-2 text-sm font-medium transition",
            o.value === value ? "bg-accent text-bg shadow" : "text-muted hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40",
        checked ? "bg-accent" : "bg-surface-2",
      )}
    >
      <span className={cx("absolute top-0.5 size-6 rounded-full transition-all", checked ? "left-[22px] bg-bg" : "left-0.5 bg-muted")} />
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl bg-surface p-4 ring-1 ring-surface-2/60", className)}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-surface-2 px-6 py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-accent">{icon}</div>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.min(1, Math.max(0, value)) * 100}%` }} />
    </div>
  );
}

export function CategoryBadge({ category, size = 40 }: { category: Pick<Category, "color" | "icon"> | null | undefined; size?: number }) {
  const color = category?.color ?? "#c3c3cc";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, backgroundColor: `${color}26`, color }}
    >
      <CategoryIcon name={category?.icon} size={Math.round(size * 0.48)} />
    </span>
  );
}

export function CheckCircle({
  done, skipped = false, onClick, label, size = 44,
}: { done: boolean; skipped?: boolean; onClick: () => void; label: string; size?: number }) {
  const inner = size - 14;
  const Icon = skipped && !done ? X : Check;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      aria-label={label}
      className="flex shrink-0 items-center justify-center rounded-full transition active:scale-90"
      style={{ width: size, height: size }}
    >
      <span
        className={cx(
          "flex items-center justify-center rounded-full border-2 transition-all duration-200",
          done
            ? "border-accent bg-accent text-bg"
            : skipped
              ? "border-surface-2 bg-surface-2 text-muted"
              : "border-muted/50 text-transparent hover:border-accent",
        )}
        style={{ width: inner, height: inner }}
      >
        <Icon size={Math.round(inner * 0.6)} strokeWidth={3} aria-hidden />
      </span>
    </button>
  );
}
