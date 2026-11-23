"use client";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Button } from "./ui";

export function SignOutButton() {
  return (
    <form
      action={logout}
      onSubmit={() => {
        // limpa as telas guardadas offline para não ficarem acessíveis sem sessão
        try { void caches.keys().then((ks) => ks.forEach((k) => void caches.delete(k))); } catch { /* sem cache */ }
      }}
    >
      <Button type="submit" className="w-full"><LogOut size={17} /> Sair</Button>
    </form>
  );
}
