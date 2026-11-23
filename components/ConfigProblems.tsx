import { AlertTriangle } from "lucide-react";

/** Lista do que falta configurar no servidor (sem valores de variáveis). */
export function ConfigProblems({ problems }: { problems: string[] }) {
  if (!problems.length) return null;
  return (
    <div role="alert" className="mb-4 rounded-2xl bg-surface p-4 text-sm ring-1 ring-accent/70">
      <p className="mb-2 flex items-center gap-2 font-semibold">
        <AlertTriangle size={16} className="text-accent" aria-hidden /> Configuração do servidor
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        {problems.map((p) => (
          <li key={p} className="break-words">{p}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Na Vercel: Settings → Environment Variables (marque Production) e depois Deployments → Redeploy.
      </p>
    </div>
  );
}
