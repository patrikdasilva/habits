import { weekday } from "@/lib/date";
import { cx } from "./ui";

export interface HeatCell {
  date: string;
  /** 0..1 de conclusão; null = sem nada devido (ou dia futuro) */
  ratio: number | null;
}

const level = (r: number | null) => (r === null ? -1 : r <= 0 ? 0 : r < 0.34 ? 1 : r < 0.67 ? 2 : r < 1 ? 3 : 4);
const BG = ["bg-surface-2", "bg-accent/25", "bg-accent/50", "bg-accent/75", "bg-accent"];

/** Grade de semanas (colunas) x dias da semana (linhas, domingo no topo). `cells` deve começar num domingo. */
export function Heatmap({ cells, className }: { cells: HeatCell[]; className?: string }) {
  const weeks = Math.ceil(cells.length / 7);
  return (
    <div className={className}>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`, gridTemplateRows: "repeat(7, auto)" }}>
        {cells.map((c, i) => {
          const l = level(c.ratio);
          return (
            <div
              key={c.date}
              title={`${c.date.split("-").reverse().join("/")}${c.ratio !== null ? ` · ${Math.round(c.ratio * 100)}%` : ""}`}
              className={cx("aspect-square rounded-[4px]", l >= 0 ? BG[l] : "bg-surface-2/30")}
              style={{ gridColumn: Math.floor(i / 7) + 1, gridRow: weekday(c.date) + 1 }}
            />
          );
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        menos
        {BG.map((b) => <span key={b} className={cx("size-3 rounded-[3px]", b)} />)}
        mais
      </div>
    </div>
  );
}
