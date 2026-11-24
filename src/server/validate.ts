import type { z } from "zod";
import { ValidationError } from "./errors";

/** Parses input with a zod schema; the first issue becomes a user-facing ValidationError (400). */
export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? "Invalid input.");
  }
  return result.data;
}
