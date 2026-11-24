import { notFound, redirect } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";
import { getDb } from "@/lib/db";
import { getDocument } from "@/lib/documents";
import { NotFoundError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/session";

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
