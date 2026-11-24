import Link from "next/link";

interface Props {
  title: string;
  message: string;
  /** Optional primary action (e.g. "Try again"); a link home is always shown. */
  action?: { label: string; onClick: () => void };
  /** Short reference users can quote when reporting a problem. */
  reference?: string;
}

/** Full-page friendly message used for errors and not-found pages. */
export default function ErrorScreen({ title, message, action, reference }: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xl font-bold">
          A
        </div>
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {action.label}
            </button>
          )}
          <Link
            href="/"
            className={
              action
                ? "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
                : "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            }
          >
            Back to documents
          </Link>
        </div>
        {reference && <p className="mt-6 text-xs text-gray-400">Reference: {reference}</p>}
      </div>
    </main>
  );
}
