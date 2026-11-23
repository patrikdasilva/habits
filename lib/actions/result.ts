export type ActionResult<T = object> = ({ ok: true; warning?: string } & T) | { ok: false; error: string };

export const fail = (e: unknown): { ok: false; error: string } => ({
  ok: false,
  error: e instanceof Error ? e.message : "Algo deu errado. Tente de novo.",
});
