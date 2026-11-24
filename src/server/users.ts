import type { Client, Row } from "@libsql/client";
import type { UserInfo } from "@/lib/types";

/** All user lookups live here so the users table is queried in one place. */

const toUser = (r: Row): UserInfo => ({ id: String(r.id), email: String(r.email), name: String(r.name) });

export async function listUsers(db: Client): Promise<UserInfo[]> {
  const res = await db.execute("SELECT id, email, name FROM users ORDER BY name");
  return res.rows.map(toUser);
}

export async function findUserById(db: Client, id: string): Promise<UserInfo | null> {
  const res = await db.execute({ sql: "SELECT id, email, name FROM users WHERE id = ?", args: [id] });
  return res.rows[0] ? toUser(res.rows[0]) : null;
}

/** Email is matched case-insensitively (stored lower-case). */
export async function findUserByEmail(db: Client, email: string): Promise<UserInfo | null> {
  const res = await db.execute({
    sql: "SELECT id, email, name FROM users WHERE email = ?",
    args: [email.trim().toLowerCase()],
  });
  return res.rows[0] ? toUser(res.rows[0]) : null;
}
