import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { createDocument } from "@/server/documents";
import { ValidationError } from "@/server/errors";
import { handle } from "@/server/http";
import { fileToHtml, titleFromFilename } from "@/server/importFile";
import { requireUser } from "@/server/session";

export const runtime = "nodejs";

/** multipart/form-data with a single `file` field -> new editable document owned by the caller. */
export const POST = handle(async (req) => {
  const user = await requireUser();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ValidationError("Expected a multipart form upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("No file was uploaded.");

  const html = await fileToHtml(file.name, Buffer.from(await file.arrayBuffer()));
  const doc = await createDocument(await getDb(), user.id, {
    title: titleFromFilename(file.name),
    contentHtml: html,
  });
  return NextResponse.json({ document: doc }, { status: 201 });
});
