import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { addShare, listShares, removeShare } from "@/lib/documents";
import { handle, readJson } from "@/lib/http";
import { requireUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return NextResponse.json({ shares: await listShares(await getDb(), user.id, id) });
});

export const POST = handle<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return NextResponse.json({ shares: await addShare(await getDb(), user.id, id, await readJson(req)) });
});

export const DELETE = handle<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const body = (await readJson(req)) as { userId?: unknown } | null;
  return NextResponse.json({ shares: await removeShare(await getDb(), user.id, id, body?.userId) });
});
