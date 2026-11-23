"use client";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { removeCategory, saveCategory } from "@/lib/actions/categories";
import type { Category } from "@/lib/types";
import { ColorPicker, COLOR_PALETTE, IconPicker } from "./pickers";
import { useUI } from "./Providers";
import { Sheet } from "./Sheet";
import { Button, CategoryBadge, Field, IconButton, Input, PageHeader } from "./ui";

interface Draft {
  id?: number;
  name: string;
  color: string;
  icon: string;
}

export function CategoryManager({ categories, usage }: { categories: Category[]; usage: Record<number, number> }) {
  const { toast, confirm } = useUI();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (d: Draft) => { setError(null); setDraft(d); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    const r = await saveCategory(draft);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast("Categoria salva", "success");
    setDraft(null);
  }

  async function remove(c: Category) {
    const n = usage[c.id] ?? 0;
    const ok = await confirm({
      title: "Excluir categoria?",
      text: n ? `${n} ${n === 1 ? "item usa" : "itens usam"} "${c.name}" e ficarão sem categoria.` : `"${c.name}" será removida.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const r = await removeCategory(c.id);
    toast(r.ok ? "Categoria excluída" : r.error, r.ok ? "success" : "error");
  }

  return (
    <div>
      <Link href="/ajustes" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-text"><ArrowLeft size={16} /> Ajustes</Link>
      <PageHeader title="Categorias" subtitle="Organize hábitos e tarefas" right={<Button variant="primary" onClick={() => open({ name: "", color: COLOR_PALETTE[8], icon: "Tag" })}><Plus size={18} strokeWidth={2.6} /> Nova</Button>} />
      <div className="grid gap-2 lg:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-surface-2/60">
            <CategoryBadge category={c} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="text-xs text-muted">{usage[c.id] ? `${usage[c.id]} ${usage[c.id] === 1 ? "item" : "itens"}` : "Sem uso"}</p>
            </div>
            <IconButton label={`Editar ${c.name}`} onClick={() => open({ id: c.id, name: c.name, color: c.color, icon: c.icon })}><Pencil size={17} /></IconButton>
            <IconButton label={`Excluir ${c.name}`} onClick={() => remove(c)}><Trash2 size={17} /></IconButton>
          </div>
        ))}
      </div>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Editar categoria" : "Nova categoria"}>
        {draft && (
          <form onSubmit={submit} className="space-y-5 pb-2">
            <div className="flex items-center gap-3">
              <CategoryBadge category={draft} size={52} />
              <Field label="Nome" className="flex-1">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={40} required autoFocus />
              </Field>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-muted">Cor</p>
              <ColorPicker value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
              <Field label="Hex" className="mt-3">
                <Input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}` })} maxLength={7} placeholder="#3b82f6" spellCheck={false} />
              </Field>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-muted">Ícone</p>
              <IconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} color={/^#[0-9a-fA-F]{6}$/.test(draft.color) ? draft.color : "#c3c3cc"} />
            </div>
            {error && <p role="alert" className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm ring-1 ring-accent">{error}</p>}
            <Button type="submit" variant="primary" loading={busy} className="w-full">Salvar</Button>
          </form>
        )}
      </Sheet>
    </div>
  );
}
