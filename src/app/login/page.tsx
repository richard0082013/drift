"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithSession, sanitizeNextPath } from "@/lib/auth/client-auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next"), "/checkin"),
    [searchParams]
  );

  const handleSignIn = async () => {
    setError(null);
    const ok = await loginWithSession("demo-user");
    if (ok) {
      router.push(nextPath);
      return;
    }

    setError("Unable to sign in right now.");
  };

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in to continue to your daily flow.</p>
      <button type="button" onClick={handleSignIn}>Sign in</button>
      {error ? <p role="alert">{error}</p> : null}
    </main>
  );
}
