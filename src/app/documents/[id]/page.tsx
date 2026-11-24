import { notFound, redirect } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";
import { getDb } from "@/server/db";
import { getDocument } from "@/server/documents";
import { NotFoundError } from "@/server/errors";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  try {
    const doc = await getDocument(await getDb(), user.id, id);
    return <DocumentEditor doc={doc} user={user} />;
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}
