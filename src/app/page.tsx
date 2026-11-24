import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Dashboard from "@/components/Dashboard";
import { getDb } from "@/server/db";
import { listDocuments } from "@/server/documents";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const docs = await listDocuments(await getDb(), user.id);

  return (
    <>
      <AppHeader user={user} />
      <Dashboard owned={docs.owned} shared={docs.shared} />
    </>
  );
}
