"use client";
import { Flag, Repeat, X } from "lucide-react";
import { formatRelative } from "@/lib/date";
import type { ItemStatus } from "@/lib/schedule";
import type { Category, TaskView } from "@/lib/types";
import { PRIORITY_LABEL } from "@/lib/types";
import { useCreate } from "./Create";
import { SwipeAction } from "./SwipeAction";
import { CategoryBadge, CheckCircle } from "./ui";
import { cx } from "@/lib/cx";

export function TaskItem({
  task: t, category, onStatus, today, showDate, hideCheck, subtitle,
}: {
  task: TaskView;
  category?: Category;
  onStatus?: (t: TaskView, s: ItemStatus) => void;
  today?: string;
  showDate?: boolean;
  hideCheck?: boolean;
  subtitle?: string;
}) {
  const { editTask } = useCreate();
  const status: ItemStatus = t.done ? "done" : t.skipped ? "skipped" : "pending";
  const interactive = !hideCheck && !!onStatus;
  const card = (
    <div className="flex items-center gap-2.5 rounded-2xl bg-surface p-2.5 pr-3 ring-1 ring-inset ring-surface-2/60">
      {interactive && (
        <CheckCircle
          done={t.done}
          skipped={t.skipped}
          onClick={() => onStatus(t, status === "pending" ? "done" : "pending")}
          label={status === "pending" ? `Concluir ${t.title}` : `Voltar ${t.title} para pendente`}
        />
      )}
      <button type="button" onClick={() => editTask(t)} className={cx("flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left", hideCheck && "pl-1")}>
        <span className="min-w-0 flex-1">
          <span className={cx("block truncate font-medium leading-snug transition-colors", (t.done || t.skipped) && "text-muted line-through decoration-muted/60")}>{t.title}</span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 text-[13px] text-muted">
            {t.skipped && <span className="inline-flex items-center gap-0.5 font-medium"><X size={12} strokeWidth={3} aria-hidden /> Não fiz</span>}
            {t.overdue && t.date && today && <span className="font-medium text-accent">Atrasada · {formatRelative(t.date, today)}</span>}
            {showDate && !t.overdue && t.date && today && <span>{formatRelative(t.date, today)}</span>}
            {t.time && <span className="tabular-nums">{t.time}</span>}
            {t.recurrence !== "none" && !subtitle && <Repeat size={12} aria-label="Recorrente" />}
            {t.priority > 0 && (
              <span className="inline-flex items-center gap-1">
                <Flag size={12} aria-hidden className={t.priority === 2 ? "fill-accent text-accent" : ""} />
                {PRIORITY_LABEL[t.priority]}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </span>
        </span>
        {category && <CategoryBadge category={category} size={30} />}
      </button>
    </div>
  );
  return interactive ? <SwipeAction status={status} onChange={(s) => onStatus(t, s)}>{card}</SwipeAction> : card;
}
