import { getDb } from "@/lib/db";
import LoginPicker from "@/components/LoginPicker";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const db = await getDb();
  const res = await db.execute("SELECT id, email, name FROM users ORDER BY name");
  const users = res.rows.map((r) => ({ id: String(r.id), email: String(r.email), name: String(r.name) }));

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">A</span>
          <h1 className="text-xl font-semibold">Ajaia Docs</h1>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Demo sign-in: choose a seeded account. Sign in as different users to try sharing.
        </p>
        <LoginPicker users={users} />
        <p className="mt-6 text-xs text-gray-500">
          Authentication is mocked for this prototype — no passwords. Sessions use a signed cookie.
        </p>
      </div>
    </main>
  );
}
