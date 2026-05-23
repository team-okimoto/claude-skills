// Next.js 16 renamed `middleware` → `proxy`. The function name must be `proxy`.
// Place this file at the same directory level as `app/` (inside `src/` if used).
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on every path EXCEPT static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|icon|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
