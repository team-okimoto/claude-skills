// Next.js 15: file convention is `middleware.ts` with exported `middleware`.
// Place this file at the same directory level as `app/` (inside `src/` if used).
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|icon|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
