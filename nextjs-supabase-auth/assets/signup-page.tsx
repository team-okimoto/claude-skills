import Link from "next/link";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-xs space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight">Create account</h1>
        </div>

        <SignupForm />

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-600 underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
