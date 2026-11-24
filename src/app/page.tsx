import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Dashboard from "@/components/Dashboard";
import { getDb } from "@/lib/db";
import { listDocuments } from "@/lib/documents";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const docs = await listDocuments(await getDb(), user.id);

  return (
    <>
      <AppHeader user={user} />
      <Dashboard initialOwned={docs.owned} initialShared={docs.shared} />
    </>
  );
}
