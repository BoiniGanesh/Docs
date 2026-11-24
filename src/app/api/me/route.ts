import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/session";

export const GET = handle(async () => NextResponse.json({ user: await requireUser() }));
