import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-xs space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-slate-500">
          No account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-emerald-600 underline-offset-2 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
