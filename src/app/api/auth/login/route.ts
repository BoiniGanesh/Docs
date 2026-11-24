import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db";
import { ValidationError } from "@/server/errors";
import { handle, readJson } from "@/server/http";
import { SESSION_COOKIE, encodeSession, sessionCookieOptions } from "@/server/session";
import { findUserById } from "@/server/users";
import { parse } from "@/server/validate";

export const POST = handle(async (req) => {
  const { userId } = parse(z.object({ userId: z.string().min(1, "userId is required.") }), await readJson(req));
  const user = await findUserById(await getDb(), userId);
  if (!user) throw new ValidationError("Unknown user.");

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, encodeSession(userId), sessionCookieOptions);
  return response;
});
