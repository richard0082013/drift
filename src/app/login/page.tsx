"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithSession, sanitizeNextPath } from "@/lib/auth/client-auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("demo@drift.local");
  const [name, setName] = useState("Demo User");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next"), "/checkin"),
    [searchParams]
  );

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await loginWithSession({ email, name });

    if (result.ok) {
      router.push(nextPath);
      return;
    }

    if (result.status === 400) {
      setError("Please enter a valid email.");
    } else {
      setError("Unable to sign in right now.");
    }
    setSubmitting(false);
  };

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in to continue to your daily flow.</p>
      <form onSubmit={handleSignIn} noValidate>
        <label>
          Email
          <input
            aria-label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Name
          <input
            aria-label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
    </main>
  );
}
