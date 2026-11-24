/** Tiny client-side fetch wrapper: JSON in/out, surfaces the server's `{ error }` message. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function api<T>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError("Network error — check your connection.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login";
    // Responses without our { error } body (e.g. a hosting timeout page) still get a readable message.
    const fallback =
      res.status >= 500
        ? "The server had a problem. Please try again in a moment."
        : `Something went wrong (error ${res.status}). Please try again.`;
    throw new ApiError(data.error ?? fallback, res.status);
  }
  return data as T;
}
