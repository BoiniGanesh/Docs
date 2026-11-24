import { NextResponse } from "next/server";
import { handle } from "@/server/http";
import { SESSION_COOKIE } from "@/server/session";

export const POST = handle(async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
});
