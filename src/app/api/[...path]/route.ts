import { NextResponse } from "next/server";

/** Unknown API routes return JSON (like every other API error) instead of an HTML page. */
const notFound = () => NextResponse.json({ error: "API route not found." }, { status: 404 });

export { notFound as GET, notFound as POST, notFound as PATCH, notFound as PUT, notFound as DELETE };
