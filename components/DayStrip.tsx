import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addDays, dayOfMonth, startOfWeek, weekdayShort } from "@/lib/date";
import { cx } from "@/lib/cx";

const href = (d: string, today: string) => (d === today ? "/" : `/?d=${d}`);

const monthLabel = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

const navBtn =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text active:scale-90";

/** Semana em um card: mês + navegação em cima, sete dias numa linha limpa embaixo. */
export function DayStrip({ date, today }: { date: string; today: string }) {
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const weekHasToday = days.includes(today);

  return (
    <div className="rounded-3xl bg-surface p-2 ring-1 ring-surface-2/60">
      <div className="flex items-center justify-between pb-1 pl-3">
        <span className="text-sm font-semibold first-letter:uppercase">{monthLabel(date)}</span>
        <div className="flex items-center">
          {!weekHasToday && (
            <Link href="/" className="mr-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-accent transition active:scale-95">
              Hoje
            </Link>
          )}
          <Link href={href(addDays(date, -7), today)} aria-label="Semana anterior" className={navBtn}>
            <ChevronLeft size={18} />
          </Link>
          <Link href={href(addDays(date, 7), today)} aria-label="Próxima semana" className={navBtn}>
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {days.map((d) => {
          const sel = d === date;
          const isToday = d === today;
          const wd = weekdayShort(d);
          return (
            <Link
              key={d}
              href={href(d, today)}
              scroll={false}
              aria-current={sel ? "date" : undefined}
              aria-label={`${wd} ${dayOfMonth(d)}${isToday ? " (hoje)" : ""}`}
              className="group flex min-w-0 flex-col items-center gap-1 rounded-2xl py-1.5 transition active:scale-95"
            >
              <span className={cx("text-[11px] font-medium uppercase", sel ? "text-text" : "text-muted")}>
                <span className="sm:hidden">{wd.charAt(0)}</span>
                <span className="hidden sm:inline">{wd}</span>
              </span>
              <span
                className={cx(
                  "flex size-9 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums transition",
                  sel ? "bg-accent text-bg" : isToday ? "text-accent ring-1 ring-accent/60" : "text-text group-hover:bg-surface-2",
                )}
              >
                {dayOfMonth(d)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
