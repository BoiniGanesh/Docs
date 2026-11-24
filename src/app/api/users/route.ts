import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { handle } from "@/server/http";
import { listUsers } from "@/server/users";

/** Public list of demo accounts for the mocked login screen and share suggestions. */
export const GET = handle(async () => NextResponse.json({ users: await listUsers(await getDb()) }));
