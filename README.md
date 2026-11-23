# Hábitos & Tarefas

App pessoal (um usuário) para hábitos diários com horário, categoria e metas, e tarefas avulsas ou recorrentes. Mobile first, também bom no desktop. Interface em português, fuso `America/Sao_Paulo` (o dia vira às 00h).

- Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript
- SQLite via `@libsql/client`: Turso em produção, arquivo local em desenvolvimento
- Login por senha (JWT em cookie httpOnly), PWA instalável e lembretes por Web Push (VAPID) agendados no Upstash QStash

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # opcional em dev
npm run dev
```

Abra http://localhost:3000. Em desenvolvimento, sem `APP_PASSWORD`, a senha é `habitos` (aviso no console).

O banco é criado em `data/habits.db` na primeira conexão, com as tabelas e as 13 categorias padrão. Para rodar o seed manualmente: `npm run db:seed`. A pasta `data/` e os arquivos `.env*` (exceto `.env.example`) não vão para o git.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` / `build` / `start` | desenvolvimento, build e servidor de produção |
| `npm run typecheck` | TypeScript sem emitir arquivos |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (agenda, streaks, validação, cron) |
| `npm run db:seed` | cria o banco e insere as categorias |

## Variáveis de ambiente

Veja `.env.example`.

| Variável | Uso |
|---|---|
| `APP_PASSWORD` | senha de login (obrigatória em produção) |
| `AUTH_SECRET` | segredo da sessão, mínimo 32 caracteres (`openssl rand -base64 32`) |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | banco na nuvem; sem elas usa `file:./data/habits.db` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | chaves Web Push |
| `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | agendamento e verificação de assinatura |
| `APP_URL` | opcional: URL pública fixa para o QStash chamar de volta |

Sem as variáveis de push o app funciona normalmente; em Ajustes aparece o que está faltando.

## Deploy na Vercel

1. **Turso**: crie um banco (`turso db create habitos`), pegue a URL (`turso db show habitos --url`) e um token (`turso db tokens create habitos`). Ou use a integração Turso da Vercel.
2. **Projeto**: importe o repositório na Vercel (framework Next.js, sem configuração extra).
3. **Variáveis**: defina `APP_PASSWORD`, `AUTH_SECRET`, `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`. As tabelas e as categorias são criadas sozinhas no primeiro acesso.
4. **VAPID**: `npx web-push generate-vapid-keys`; coloque a chave pública em `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (variável de build, faça redeploy depois), a privada em `VAPID_PRIVATE_KEY` e um `VAPID_SUBJECT` como `mailto:voce@exemplo.com`.
5. **QStash**: crie uma conta no Upstash, ative o QStash (ou use a integração da Vercel) e copie `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` (e `QSTASH_URL` se a região exigir).
6. Faça o deploy, abra o app, entre com a senha e em **Ajustes → Notificações** toque em "Ativar notificações" e depois em "Enviar teste". No iPhone, instale antes na Tela de Início (iOS 16.4+).

### Como os lembretes funcionam

Ao salvar um hábito ou tarefa com lembrete e horário, o servidor apaga os agendamentos antigos e cria no QStash um schedule cron (`CRON_TZ=America/Sao_Paulo MM HH * * dias`). Tarefa avulsa usa uma mensagem única com `notBefore`. O QStash chama `/api/push/remind` (assinatura verificada); a rota só envia se o item é devido hoje e ainda não foi concluído, e remove assinaturas expiradas (404/410). Tarefas mensais no dia 29 a 31 disparam o cron apenas nos meses que têm o dia; o app mostra a tarefa no último dia do mês, mas o lembrete não é enviado nos meses mais curtos.

## Estrutura

```
app/(auth)/login        login
app/(app)/              Hoje, habitos, tarefas, estatisticas, ajustes, categorias
app/api/push/*          subscribe, unsubscribe, test, remind
app/api/backup          exportação JSON
components/             UI (ui.tsx, Sheet, HabitCard, TaskItem, forms, ...)
lib/schedule.ts         regras puras (agenda, streak, períodos)  -> tests/
lib/db, lib/repo        esquema, seed e consultas
lib/actions             server actions
lib/server              auth, push, lembretes
proxy.ts                proteção de rotas (Next 16)
```

## Dados e backup

Ajustes → Exportar backup baixa todas as tabelas (exceto as assinaturas de push) em JSON.
