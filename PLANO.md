# Plano — Hábitos & Tarefas

App pessoal (um usuário) para hábitos diários/noturnos com horário, categoria e metas, e tarefas avulsas ou recorrentes. Mobile first, também bom no desktop. Português (pt-BR), fuso `America/Sao_Paulo`, o dia vira às 00h.

## Decisões (respostas do usuário)

| Tema | Decisão |
|---|---|
| Metas | Hábito tipo **check** (feito/não feito) ou **quantidade** (meta diária numérica + unidade, registro por incrementos, barra de progresso). |
| Repetição | **Dias da semana** + **horário opcional**. Tela "Hoje" agrupa em Manhã (05–12h) / Tarde (12–18h) / Noite (18–05h) / Qualquer hora, ordenado pelo horário. |
| Tarefas | **Avulsa** (com data, ou sem data = "Caixa de entrada") ou **recorrente**: diária, dias da semana, semanal (1 dia), mensal (dia do mês). Ocorrências marcadas por dia. Prioridade (baixa/média/alta) e categoria opcionais, horário opcional. |
| Extras | Streaks + estatísticas, login com senha, PWA instalável, lembretes Web Push. |
| Hospedagem | **Vercel**, igual ao `treino-app`: SQLite na nuvem pelo **Turso** (`@libsql/client`). Local: arquivo `file:./data/habits.db` (mesmo client). |
| Push | Web Push real (VAPID) agendado no **Upstash QStash**, como no `treino-app`. |

## Stack

- Next.js 16 (App Router, TypeScript), React 19, Tailwind CSS v4, `lucide-react`.
- `@libsql/client` — `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`; se ausente, usa `file:./data/habits.db` (pasta `data/` no `.gitignore`).
- `jose` (sessão JWT em cookie httpOnly), `web-push`, `@upstash/qstash`, `server-only`.
- Vitest para funções puras (agenda, streak, datas).
- Referência de padrões: `/home/user/treino-app` (`lib/server/push.ts`, `app/api/push/*`, `public/sw.js`, `app/manifest.ts`, `next.config.ts`).

## Paleta (tokens em `app/globals.css` via `@theme`)

| Token | Cor | Uso |
|---|---|---|
| `bg` | `#171721` | fundo da página, `theme_color` |
| `surface` | `#1e1e2a` | cards, barra de navegação |
| `surface-2` | `#2c2c3a` | inputs, bordas, itens hover, trilho das barras |
| `text` | `#ededf3` | texto principal |
| `muted` | `#c3c3cc` | texto secundário |
| `accent` | `#afb2ce` | botões primários (texto `#171721`), progresso, check, foco |

Cores das categorias (bolinha/ícone) são livres por categoria; a UI geral usa só a paleta. Tema único escuro.

## Banco (SQLite) — `lib/db/schema.ts`

Datas como texto `YYYY-MM-DD` (dia local em São Paulo); horários `HH:MM`; dias da semana como texto `"0123456"` (0 = domingo).

```sql
categories (id INTEGER PK, name TEXT UNIQUE, color TEXT, icon TEXT, sort INTEGER, created_at)
habits (id PK, name, description, category_id FK NULL,
        type TEXT CHECK(type IN ('check','quantity')),
        target REAL NULL, unit TEXT NULL, step REAL NULL,       -- quantity: meta/dia, unidade, incremento padrão
        days TEXT DEFAULT '0123456', time TEXT NULL,             -- horário opcional
        reminder INTEGER DEFAULT 0, reminder_schedule_ids TEXT NULL, -- JSON dos ids no QStash
        start_date TEXT, archived INTEGER DEFAULT 0, sort INTEGER, created_at)
habit_logs (habit_id FK, date TEXT, value REAL, done INTEGER, updated_at, PRIMARY KEY(habit_id, date))
tasks (id PK, title, notes, category_id NULL, priority INTEGER DEFAULT 0,
       recurrence TEXT CHECK(recurrence IN ('none','daily','weekdays','weekly','monthly')),
       days TEXT NULL, month_day INTEGER NULL, date TEXT NULL, time TEXT NULL,
       reminder INTEGER DEFAULT 0, reminder_schedule_ids TEXT NULL,
       start_date TEXT, end_date TEXT NULL, archived INTEGER DEFAULT 0, created_at)
task_completions (task_id FK, date TEXT, done_at, PRIMARY KEY(task_id, date))  -- avulsa: date = a própria data (ou dia em que concluiu, se sem data)
push_subscriptions (endpoint TEXT PK, p256dh, auth, created_at)
settings (key TEXT PK, value TEXT)
```

Tabelas criadas e **seed** executados automaticamente na primeira conexão (`CREATE TABLE IF NOT EXISTS` + insere categorias se a tabela estiver vazia). Também `npm run db:seed` para rodar manualmente.

### Seed de categorias (nome · ícone lucide · cor)
Academia `Dumbbell` #f97316 · Trabalho `Briefcase` #3b82f6 · Leitura `BookOpen` #a855f7 · Bíblia `BookHeart` #eab308 · Água `Droplet` #06b6d4 · Passos `Footprints` #22c55e · Sono `Moon` #6366f1 · Alimentação `Apple` #ef4444 · Oração/Meditação `Sparkles` #ec4899 · Estudos `GraduationCap` #14b8a6 · Finanças `Wallet` #84cc16 · Casa `Home` #f59e0b · Saúde `HeartPulse` #f43f5e (extra sugerido).

Não criar hábitos de exemplo automaticamente — mas a tela de novo hábito oferece **sugestões rápidas** (1 toque preenche o formulário): Beber 3000 ml de água (Água, quantity, step 250), 10.000 passos (Passos, quantity, step 1000), Ler 20 páginas (Leitura), Leitura da Bíblia (Bíblia, 21:30), Treino (Academia, seg–sex), Dormir até 23h (Sono, 22:45).

## Regras de negócio — `lib/schedule.ts` (puras, com testes)

- `today()` → `YYYY-MM-DD` em `America/Sao_Paulo` (`Intl.DateTimeFormat('en-CA', {timeZone})`).
- `habitDueOn(habit, date)`: `date >= start_date` e weekday ∈ `days`.
- `habitDone(habit, log)`: check → `done=1`; quantity → `value >= target`.
- `taskDueOn(task, date)`: none → `date == task.date`; daily → sempre; weekdays → weekday ∈ days; weekly → weekday == days[0]; monthly → dia == month_day (se o mês não tiver o dia, último dia do mês). Respeita `start_date`/`end_date`.
- **Atrasadas**: tarefas avulsas com data < hoje e não concluídas aparecem no topo de "Hoje" em "Atrasadas". Recorrentes não acumulam.
- **Streak** por hábito: dias devidos consecutivos concluídos, contando para trás a partir de hoje (se hoje ainda não foi feito, começa de ontem sem quebrar). Dias não devidos são ignorados. Também "melhor sequência".
- Período: Manhã 05:00–11:59, Tarde 12:00–17:59, Noite 18:00–04:59, sem horário = "Qualquer hora".

## Telas (App Router, em `app/(app)/...`)

Layout mobile: conteúdo `max-w` confortável, **bottom nav** fixa (Hoje · Hábitos · Tarefas · Estatísticas · Ajustes) com `safe-area-inset-bottom`; **FAB "+"** que abre sheet "Novo hábito / Nova tarefa". Desktop (≥ lg): **sidebar** à esquerda no lugar da bottom nav e conteúdo em 2 colunas onde fizer sentido (Hoje: hábitos | tarefas). Alvos de toque ≥ 44px, nada de scroll horizontal da página, formulários em bottom sheet no mobile / modal centrado no desktop.

1. **/login** — campo senha, "Entrar". Cookie de sessão de 90 dias.
2. **/ (Hoje)** — cabeçalho com data por extenso e anel de progresso do dia (% de hábitos + tarefas concluídos). Seletor de dia em faixa (semana, ← →) para ver/editar dias passados. Seções:
   - Atrasadas (tarefas).
   - Hábitos agrupados por período, cada card: ícone/cor da categoria, nome, horário, streak 🔥, e
     - check: toque grande para marcar/desmarcar;
     - quantity: barra de progresso `valor/meta unidade`, botões `−step` / `+step`, toque longo ou ícone para digitar valor exato.
   - Tarefas do dia (avulsas + ocorrências recorrentes), check, prioridade, horário.
   - Chips de filtro por categoria.
   - Atualização otimista (UI muda na hora, server action em segundo plano, reverte com toast em erro).
3. **/habitos** — lista por categoria, arquivados à parte; criar/editar/arquivar/excluir. Formulário: nome, descrição, categoria, tipo (check/quantidade → meta, unidade, incremento), dias (chips D S T Q Q S S + atalhos "Todos", "Seg–Sex", "Fim de semana"), horário (opcional), lembrete (on/off, exige horário), data de início. Detalhe do hábito: streak atual/melhor, % 30 dias, heatmap de 12 semanas, histórico editável.
4. **/tarefas** — abas: Hoje · Próximas (7 dias) · Caixa de entrada (sem data) · Recorrentes · Concluídas. Formulário: título, notas, categoria, prioridade, tipo de repetição (Nenhuma / Diária / Dias da semana / Semanal / Mensal) com campos condicionais, data, horário, lembrete.
5. **/estatisticas** — período 7/30/90 dias: % de conclusão geral, por categoria (barras), por hábito (lista com streak), heatmap geral, total de tarefas concluídas. Gráficos em SVG/CSS próprios (sem lib pesada).
6. **/categorias** (via Ajustes) — CRUD: nome, cor (paleta de 12 + hex), ícone (grid de ~30 ícones lucide). Excluir categoria em uso → itens ficam "Sem categoria".
7. **/ajustes** — notificações (ativar push neste aparelho, testar, status/variáveis faltando como no treino-app), categorias, instalar app (instruções iOS/Android), exportar backup JSON, sair.

Toda mutação via **Server Actions** em `lib/actions/*.ts` + `revalidatePath`. Leituras em Server Components chamando `lib/repo/*.ts`.

## Autenticação

- `APP_PASSWORD` (env) e `AUTH_SECRET` (env, ≥32 chars). Login compara em tempo constante, emite JWT HS256 (`jose`) no cookie `session` (httpOnly, secure em prod, sameSite lax, 90 dias).
- `proxy.ts` (Next 16 — antigo middleware) redireciona para `/login` sem sessão; libera `/login`, `/api/push/remind` (verificada pela assinatura do QStash), `/manifest.webmanifest`, `/sw.js`, ícones, `_next`.
- Rate limit simples no login (atraso de 1s em falha).
- Em dev sem `APP_PASSWORD`, senha padrão `habitos` com aviso no console.

## Push / lembretes (seguir o treino-app)

- `public/sw.js`: cache do app shell (offline mostra a última tela) + handlers `push` e `notificationclick` (abre `/`).
- Ajustes → "Ativar notificações": `Notification.requestPermission` → `pushManager.subscribe` (VAPID público) → `POST /api/push/subscribe` salva em `push_subscriptions`.
- Ao salvar hábito/tarefa com `reminder=1` e `time`: o servidor apaga schedules antigos (`reminder_schedule_ids`) e cria no QStash um **schedule cron** por item: `CRON_TZ=America/Sao_Paulo MM HH * * <dias>` (tarefa mensal: `MM HH <dia> * *`; avulsa: mensagem única com `notBefore`). Destino `/api/push/remind` com body `{kind, id}`. Ao desativar/excluir/arquivar, apaga os schedules.
- `/api/push/remind`: verifica assinatura QStash; carrega o item; se não é devido hoje ou já está concluído, não envia; senão envia a todas as assinaturas (remove as que retornarem 404/410). Título: "⏰ {nome}", corpo: meta/hora/categoria.
- Sem as variáveis de push, o app funciona e Ajustes mostra o que falta.

## Estrutura

```
app/(auth)/login/page.tsx
app/(app)/layout.tsx  page.tsx  habitos/…  tarefas/…  estatisticas/…  ajustes/…  categorias/…
app/api/push/{subscribe,unsubscribe,test,remind}/route.ts
app/manifest.ts  app/icon.svg  app/apple-icon.png  app/globals.css  app/layout.tsx
components/ (ui.tsx, BottomNav, Sidebar, Fab, Sheet, HabitCard, TaskItem, HabitForm, TaskForm, DayStrip, ProgressRing, Heatmap, CategoryPicker, IconPicker, Toast)
lib/db/{client.ts,schema.ts,seed.ts}  lib/repo/{habits,tasks,categories,stats}.ts
lib/actions/{habits,tasks,categories,auth,push}.ts  lib/schedule.ts  lib/date.ts
lib/server/{auth.ts,push.ts,reminders.ts}  proxy.ts  public/sw.js  public/icons/*
scripts/seed.mjs  tests/schedule.test.ts  .env.example  README.md
```

## Critérios de pronto

- `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test` passam.
- Banco local criado com as 13 categorias seedadas (verificar com uma query).
- Fluxo testado no navegador (Playwright, iPhone 14 e desktop 1440px): login → criar hábito check e de quantidade → marcar/incrementar → criar tarefa avulsa e recorrente → concluir → estatísticas mostram dados. Sem overflow horizontal em 375px.
- README em português com rodar local + deploy na Vercel (Turso, QStash, VAPID, APP_PASSWORD, AUTH_SECRET).
