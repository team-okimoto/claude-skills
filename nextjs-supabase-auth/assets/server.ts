import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used from Server Components, Route Handlers, and Server Actions.
// `cookies()` is async in Next 14+ — await it before handing the store to
// Supabase. Create a new client per request; never share one globally.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Server Components can't set cookies — the call throws. That's
          // fine: proxy.ts / middleware.ts handles session refresh writes.
          // Server Actions and Route Handlers *can* set cookies, so this
          // try/catch keeps both happy.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // ignore — see comment above
          }
        },
      },
    },
  );
}
