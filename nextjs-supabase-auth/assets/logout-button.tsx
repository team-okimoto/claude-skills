"use client";

import { signOut } from "@/lib/auth-actions";

// <form action={signOut}> submits to a Server Action endpoint. signOut()
// clears the Supabase cookies and redirects to /login — no client state to
// manage here.
export default function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
      >
        Log out
      </button>
    </form>
  );
}
