import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { createDocument, listDocuments } from "@/server/documents";
import { handle, readJson } from "@/server/http";
import { requireUser } from "@/server/session";

export const GET = handle(async () => {
  const user = await requireUser();
  return NextResponse.json(await listDocuments(await getDb(), user.id));
});

export const POST = handle(async (req) => {
  const user = await requireUser();
  const doc = await createDocument(await getDb(), user.id, await readJson(req));
  return NextResponse.json({ document: doc }, { status: 201 });
});
