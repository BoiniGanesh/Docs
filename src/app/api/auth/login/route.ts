import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db";
import { ValidationError } from "@/server/errors";
import { handle, readJson } from "@/server/http";
import { parse } from "@/server/documents";
import { SESSION_COOKIE, encodeSession, sessionCookieOptions } from "@/server/session";

export const POST = handle(async (req) => {
  const { userId } = parse(z.object({ userId: z.string().min(1, "userId is required.") }), await readJson(req));
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT id, email, name FROM users WHERE id = ?", args: [userId] });
  const user = res.rows[0];
  if (!user) throw new ValidationError("Unknown user.");

  const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  response.cookies.set(SESSION_COOKIE, encodeSession(userId), sessionCookieOptions);
  return response;
});
