"use server";
import { revalidatePath } from "next/cache";
import * as repo from "@/lib/repo/categories";
import { isAuthenticated } from "@/lib/server/auth";
import { normalizeCategory } from "@/lib/validate";
import { fail, type ActionResult } from "./result";

async function guard() {
  if (!(await isAuthenticated())) throw new Error("Sessão expirada. Entre novamente.");
}
const refresh = () => revalidatePath("/", "layout");

export async function saveCategory(raw: { id?: number; name: string; color: string; icon: string }): Promise<ActionResult> {
  try {
    await guard();
    const c = normalizeCategory(raw);
    if (raw.id) await repo.updateCategory(raw.id, c);
    else await repo.createCategory(c);
    refresh();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error && /UNIQUE/i.test(e.message) ? new Error("Já existe uma categoria com esse nome.") : e;
    return fail(msg);
  }
}

export async function removeCategory(id: number): Promise<ActionResult> {
  try {
    await guard();
    await repo.deleteCategory(id);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
