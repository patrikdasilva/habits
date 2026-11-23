// Esquema SQLite. Datas YYYY-MM-DD (dia local em São Paulo), horários HH:MM,
// dias da semana como texto "0123456" (0 = domingo).
export const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category_id INTEGER REFERENCES categories(id),
    type TEXT NOT NULL CHECK(type IN ('check','quantity')),
    target REAL,
    unit TEXT,
    step REAL,
    days TEXT NOT NULL DEFAULT '0123456',
    time TEXT,
    reminder INTEGER NOT NULL DEFAULT 0,
    reminder_schedule_ids TEXT,
    start_date TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS habit_logs (
    habit_id INTEGER NOT NULL REFERENCES habits(id),
    date TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (habit_id, date)
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    category_id INTEGER REFERENCES categories(id),
    priority INTEGER NOT NULL DEFAULT 0,
    recurrence TEXT NOT NULL DEFAULT 'none' CHECK(recurrence IN ('none','daily','weekdays','weekly','monthly')),
    days TEXT,
    month_day INTEGER,
    date TEXT,
    time TEXT,
    reminder INTEGER NOT NULL DEFAULT 0,
    reminder_schedule_ids TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS task_completions (
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'done',
    done_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (task_id, date)
  )`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    endpoint TEXT PRIMARY KEY,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date)`,
  `CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(date)`,
];

/** Colunas adicionadas depois da primeira versão (bancos já existentes). */
export const MIGRATIONS: string[] = [
  "ALTER TABLE habit_logs ADD COLUMN skipped INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE task_completions ADD COLUMN status TEXT NOT NULL DEFAULT 'done'",
];
