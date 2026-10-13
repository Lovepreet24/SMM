"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function googleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function emailLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function signup() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    setMessage(
      error
        ? error.message
        : "Account request submitted. Check your email to confirm signup."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-black">
            SR
          </div>
          <h1 className="text-3xl font-bold">SMM Roy</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to your account
          </p>
        </div>

        <button
          type="button"
          onClick={googleLogin}
          disabled={loading}
          className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-white/10" />
          OR WITH EMAIL
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void emailLogin();
          }}
          className="space-y-4"
        >
          <label className="block text-sm text-slate-300">
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
              placeholder="At least 6 characters"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            Sign in
          </button>

          <button
            type="button"
            disabled={loading || !email || password.length < 6}
            onClick={() => void signup()}
            className="w-full rounded-xl border border-white/15 px-4 py-3 font-semibold hover:bg-white/5 disabled:opacity-50"
          >
            Create account
          </button>
        </form>

        {message && (
          <p role="status" className="mt-5 break-words text-sm text-amber-300">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure authentication powered by Supabase
        </p>
      </section>
    </main>
  );
}
