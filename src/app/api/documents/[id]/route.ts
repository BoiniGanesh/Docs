import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { deleteDocument, getDocument, updateDocument } from "@/lib/documents";
import { handle, readJson } from "@/lib/http";
import { requireUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return NextResponse.json({ document: await getDocument(await getDb(), user.id, id) });
});

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const doc = await updateDocument(await getDb(), user.id, id, await readJson(req));
  return NextResponse.json({ document: doc });
});

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteDocument(await getDb(), user.id, id);
  return NextResponse.json({ ok: true });
});
