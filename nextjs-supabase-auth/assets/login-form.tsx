"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/auth-actions";

// useActionState wires the form to a Server Action and keeps the action's
// returned value (errors) in React state. When the action calls redirect()
// the function never returns — so we only see a value here on failure.
async function action(_prev: { error?: string } | undefined, formData: FormData) {
  const result = await signIn(formData);
  return result ?? undefined;
}

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-200"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-200"
        />
      </label>
      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
