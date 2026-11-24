import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createDocument } from "@/lib/documents";
import { ValidationError } from "@/lib/errors";
import { handle } from "@/lib/http";
import { fileToHtml, titleFromFilename } from "@/lib/importFile";
import { requireUser } from "@/lib/session";

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
