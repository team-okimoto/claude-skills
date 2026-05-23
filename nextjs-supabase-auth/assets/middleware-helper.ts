import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Helper used by proxy.ts (Next 16) or middleware.ts (Next 15). It:
//   1. Builds a Supabase client wired to read/write cookies on this request.
//   2. Calls getUser() — triggers a token refresh if the access token
//      expired, refreshed session cookies are written back via setAll.
//   3. Redirects to /login if the user isn't authenticated (with exceptions).
//
// IMPORTANT: don't put logic between createServerClient and getUser. Delaying
// getUser causes hard-to-debug auth bugs per the Supabase docs.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() verifies the JWT with the Auth server (unlike getSession()).
  // It also refreshes the access token if needed; refreshed cookies are
  // written above in setAll.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Add any other public routes (marketing pages, public API) to this check.
  const isAuthRoute =
    path === "/login" || path === "/signup" || path === "/auth/callback";

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
