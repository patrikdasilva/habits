"use client";
import { Ban } from "lucide-react";
import { CategoryIcon, ICON_NAMES } from "./icons";
import { Chip, cx } from "./ui";
import type { Category } from "@/lib/types";

const DAY_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** Dias da semana: múltipla escolha (D S T Q Q S S) ou escolha única. */
export function DayChips({ value, onChange, single, shortcuts }: { value: string; onChange: (v: string) => void; single?: boolean; shortcuts?: boolean }) {
  const toggle = (i: number) => {
    const c = String(i);
    if (single) return onChange(c);
    const set = new Set(value.split(""));
    if (set.has(c)) set.delete(c);
    else set.add(c);
    onChange([...set].sort().join(""));
  };
  const norm = [...new Set(value.split(""))].sort().join("");
  return (
    <div>
      <div className="flex justify-between gap-1.5">
        {DAY_LETTERS.map((l, i) => {
          const on = value.includes(String(i));
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              aria-label={DAY_NAMES[i]}
              onClick={() => toggle(i)}
              className={cx(
                "flex size-11 min-w-0 flex-1 items-center justify-center rounded-full text-sm font-semibold transition active:scale-90",
                on ? "bg-accent text-bg" : "bg-surface-2 text-muted hover:text-text",
              )}
              style={{ maxWidth: 48 }}
            >
              {l}
            </button>
          );
        })}
      </div>
      {shortcuts && !single && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Chip active={norm === "0123456"} onClick={() => onChange("0123456")}>Todos</Chip>
          <Chip active={norm === "12345"} onClick={() => onChange("12345")}>Seg–Sex</Chip>
          <Chip active={norm === "06"} onClick={() => onChange("06")}>Fim de semana</Chip>
        </div>
      )}
    </div>
  );
}

export function CategoryPicker({ categories, value, onChange }: { categories: Category[]; value: number | null; onChange: (id: number | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={value === null} onClick={() => onChange(null)}>
        <Ban size={14} aria-hidden /> Nenhuma
      </Chip>
      {categories.map((c) => (
        <Chip key={c.id} active={value === c.id} onClick={() => onChange(c.id)}>
          <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
          {c.name}
        </Chip>
      ))}
    </div>
  );
}

export const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <div className="grid grid-cols-6 gap-2.5">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Cor ${c}`}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
            className={cx("h-10 rounded-xl transition active:scale-90", value === c && "ring-2 ring-text ring-offset-2 ring-offset-surface")}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

export function IconPicker({ value, onChange, color }: { value: string; onChange: (i: string) => void; color: string }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ICON_NAMES.map((n) => {
        const on = value === n;
        return (
          <button
            key={n}
            type="button"
            aria-label={n}
            aria-pressed={on}
            onClick={() => onChange(n)}
            className={cx("flex h-11 items-center justify-center rounded-xl transition active:scale-90", on ? "bg-surface-2 ring-2 ring-accent" : "bg-surface-2/50 hover:bg-surface-2")}
            style={{ color: on ? color : undefined }}
          >
            <CategoryIcon name={n} size={20} className={on ? "" : "text-muted"} />
          </button>
        );
      })}
    </div>
  );
}
