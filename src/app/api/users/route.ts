import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { listUsers } from "@/server/users";

/** Public list of demo accounts for the mocked login screen and share suggestions. */
export async function GET() {
  return NextResponse.json({ users: await listUsers(await getDb()) });
}
