import { NextResponse } from "next/server";
import { AppError, ValidationError } from "./errors";

/** Wraps a route handler so thrown AppErrors become `{ error }` JSON with the right status. */
export function handle<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}
