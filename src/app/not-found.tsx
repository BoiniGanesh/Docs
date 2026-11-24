import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Document not found</h1>
        <p className="text-gray-600 mb-6">It may have been deleted, or it hasn&apos;t been shared with you.</p>
        <Link href="/" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Back to documents
        </Link>
      </div>
    </main>
  );
}
