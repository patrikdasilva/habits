import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addDays, dayOfMonth, startOfWeek, weekdayShort } from "@/lib/date";
import { cx } from "./ui";

const href = (d: string, today: string) => (d === today ? "/" : `/?d=${d}`);

/** Faixa da semana com setas; cada dia é um link (?d=YYYY-MM-DD). */
export function DayStrip({ date, today }: { date: string; today: string }) {
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="flex items-center gap-1">
      <Link href={href(addDays(date, -7), today)} aria-label="Semana anterior" className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text active:scale-90">
        <ChevronLeft size={20} />
      </Link>
      <div className="grid min-w-0 flex-1 grid-cols-7 gap-1">
        {days.map((d) => {
          const sel = d === date;
          return (
            <Link
              key={d}
              href={href(d, today)}
              scroll={false}
              aria-current={sel ? "date" : undefined}
              aria-label={`${weekdayShort(d)} ${dayOfMonth(d)}${d === today ? " (hoje)" : ""}`}
              className={cx(
                "relative flex min-h-[3.75rem] min-w-0 flex-col items-center justify-center rounded-2xl transition active:scale-95",
                sel ? "bg-accent text-bg" : "bg-surface text-text hover:bg-surface-2",
              )}
            >
              <span className={cx("text-[11px] font-medium uppercase", sel ? "text-bg/80" : "text-muted")}>{weekdayShort(d)}</span>
              <span className="text-lg font-bold tabular-nums leading-tight">{dayOfMonth(d)}</span>
              {d === today && <span className={cx("absolute bottom-1.5 size-1 rounded-full", sel ? "bg-bg" : "bg-accent")} />}
            </Link>
          );
        })}
      </div>
      <Link href={href(addDays(date, 7), today)} aria-label="Próxima semana" className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text active:scale-90">
        <ChevronRight size={20} />
      </Link>
    </div>
  );
}
