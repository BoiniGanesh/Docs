import { NextResponse } from "next/server";
import { getDb } from "@/server/db";

/** Public list of demo accounts for the mocked login screen and share suggestions. */
export async function GET() {
  const db = await getDb();
  const res = await db.execute("SELECT id, email, name FROM users ORDER BY name");
  return NextResponse.json({ users: res.rows.map((r) => ({ id: r.id, email: r.email, name: r.name })) });
}
