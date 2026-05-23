"use client";

import { createBrowserClient } from "@supabase/ssr";

// Used from Client Components. Reads NEXT_PUBLIC_* env vars baked at build.
// A single browser client per page is fine — Supabase manages cookies itself.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
