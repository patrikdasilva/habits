import { BarChart3, CalendarCheck, ListChecks, Repeat, Settings, type LucideIcon } from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/", label: "Hoje", icon: CalendarCheck, match: (p) => p === "/" },
  { href: "/habitos", label: "Hábitos", icon: Repeat, match: (p) => p.startsWith("/habitos") },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks, match: (p) => p.startsWith("/tarefas") },
  { href: "/estatisticas", label: "Estatísticas", icon: BarChart3, match: (p) => p.startsWith("/estatisticas") },
  { href: "/ajustes", label: "Ajustes", icon: Settings, match: (p) => p.startsWith("/ajustes") || p.startsWith("/categorias") },
];
