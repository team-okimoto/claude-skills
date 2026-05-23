"use server";

// Server Actions for sign in / sign up / sign out. Mount the forms with
// `<form action={signIn}>` (or via useActionState for inline error display)
// and the logout button with `<form action={signOut}>`.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  // With email confirmation OFF, signUp also signs the user in. With it ON,
  // the proxy will bounce them back to /login until they click the email
  // confirmation link — same redirect target either way.
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
