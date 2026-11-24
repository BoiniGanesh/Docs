import { createClient, type Client } from "@libsql/client";

/**
 * Single storage driver for every environment:
 *  - local dev / tests: a SQLite file (default `file:local.db`)
 *  - production: Turso (hosted libSQL) via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 */

export const SEED_USERS = [
  { id: "u_alice", email: "alice@ajaia.test", name: "Alice Johnson" },
  { id: "u_bob", email: "bob@ajaia.test", name: "Bob Smith" },
  { id: "u_carol", email: "carol@ajaia.test", name: "Carol Lee" },
] as const;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS documents (
     id TEXT PRIMARY KEY,
     owner_id TEXT NOT NULL REFERENCES users(id),
     title TEXT NOT NULL,
     content_html TEXT NOT NULL DEFAULT '',
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id)`,
  `CREATE TABLE IF NOT EXISTS document_shares (
     document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
     user_id TEXT NOT NULL REFERENCES users(id),
     role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
     created_at TEXT NOT NULL,
     PRIMARY KEY (document_id, user_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_shares_user ON document_shares(user_id)`,
];

const WELCOME_HTML = `<h1>Welcome to Ajaia Docs</h1>
<p>This sample document is owned by <strong>Alice</strong> and shared with <strong>Bob</strong> as an <em>editor</em>.</p>
<h2>Try it out</h2>
<ul><li>Format text with <strong>bold</strong>, <em>italic</em> and <u>underline</u></li><li>Use headings and lists from the toolbar</li><li>Share with <code>carol@ajaia.test</code> as a viewer</li></ul>
<ol><li>Changes save automatically</li><li>Refresh the page — everything persists</li></ol>`;

export async function initSchema(db: Client, { seed = true } = {}) {
  await db.batch(SCHEMA, "write");
  if (!seed) return;

  await db.batch(
    SEED_USERS.map((u) => ({
      sql: "INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)",
      args: [u.id, u.email, u.name],
    })),
    "write",
  );

  const now = new Date().toISOString();
  await db.batch(
    [
      {
        sql: `INSERT OR IGNORE INTO documents (id, owner_id, title, content_html, created_at, updated_at)
              VALUES ('doc_welcome', 'u_alice', 'Welcome to Ajaia Docs', ?, ?, ?)`,
        args: [WELCOME_HTML, now, now],
      },
      {
        sql: `INSERT OR IGNORE INTO document_shares (document_id, user_id, role, created_at)
              VALUES ('doc_welcome', 'u_bob', 'editor', ?)`,
        args: [now],
      },
    ],
    "write",
  );
}

let clientPromise: Promise<Client> | null = null;

/** Lazily create the client and run idempotent schema/seed once per process. */
export function getDb(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL || "file:local.db",
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      await client.execute("PRAGMA foreign_keys = ON");
      await initSchema(client);
      return client;
    })().catch((err) => {
      clientPromise = null; // allow retry on next request
      throw err;
    });
  }
  return clientPromise;
}
