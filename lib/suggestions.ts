import type { HabitType } from "./types";

export interface HabitSuggestion {
  label: string;
  name: string;
  category: string; // nome da categoria do seed
  type: HabitType;
  target?: number;
  unit?: string;
  step?: number;
  days?: string;
  time?: string;
}

export const HABIT_SUGGESTIONS: HabitSuggestion[] = [
  { label: "Beber 3000 ml de água", name: "Beber água", category: "Água", type: "quantity", target: 3000, unit: "ml", step: 250 },
  { label: "10.000 passos", name: "Caminhar 10.000 passos", category: "Passos", type: "quantity", target: 10000, unit: "passos", step: 1000 },
  { label: "Ler 20 páginas", name: "Ler 20 páginas", category: "Leitura", type: "quantity", target: 20, unit: "páginas", step: 1 },
  { label: "Leitura da Bíblia", name: "Leitura da Bíblia", category: "Bíblia", type: "check", time: "21:30" },
  { label: "Treino", name: "Treino", category: "Academia", type: "check", days: "12345" },
  { label: "Dormir até 23h", name: "Dormir até 23h", category: "Sono", type: "check", time: "22:45" },
];
