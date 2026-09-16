import { NextResponse } from "next/server";

// Authentication is checked by protected server layouts and server actions.
// Keeping edge middleware independent of Supabase prevents an optional external
// configuration or session-refresh failure from taking the whole site offline.
export function middleware() { return NextResponse.next(); }
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"] };
