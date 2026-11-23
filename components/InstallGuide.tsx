import { Plus, Share } from "lucide-react";
import { Card } from "./ui";

export function InstallGuide() {
  return (
    <Card className="space-y-4 text-sm">
      <div>
        <p className="mb-1.5 flex items-center gap-2 font-semibold"><Share size={15} className="text-accent" /> iPhone / iPad (Safari)</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>Abra o app no Safari e toque em Compartilhar.</li>
          <li>Escolha <span className="text-text">Adicionar à Tela de Início</span>.</li>
          <li>Abra pelo ícone novo. As notificações só funcionam assim, no iOS 16.4 ou mais recente.</li>
        </ol>
      </div>
      <div>
        <p className="mb-1.5 flex items-center gap-2 font-semibold"><Plus size={15} className="text-accent" /> Android (Chrome)</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>Toque no menu (três pontos) do Chrome.</li>
          <li>Escolha <span className="text-text">Instalar app</span> ou <span className="text-text">Adicionar à tela inicial</span>.</li>
        </ol>
      </div>
      <p className="text-muted">No computador, use o ícone de instalação na barra de endereço do Chrome ou Edge.</p>
    </Card>
  );
}
