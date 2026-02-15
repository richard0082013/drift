"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithSession, sanitizeNextPath } from "@/lib/auth/client-auth";
import { ErrorState, LoadingState } from "@/components/page-feedback";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function LoginPageContent() {
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
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm">
        <CardBody className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-heading font-bold text-slate-800">Login</h1>
            <p className="text-sm text-slate-500">Sign in to continue to your daily flow.</p>
          </div>

          <form onSubmit={handleSignIn} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="login-email"
                aria-label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-slate-700 bg-white border border-cream-200 focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-400 transition-colors duration-200 placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="login-name" className="text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="login-name"
                aria-label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-slate-700 bg-white border border-cream-200 focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-400 transition-colors duration-200 placeholder:text-slate-400"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting ? "Submitting..." : "Sign in"}
            </Button>
          </form>

          {error ? <ErrorState message={error} /> : null}
        </CardBody>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Card className="w-full max-w-sm"><CardBody className="p-6 text-center space-y-2"><h1 className="text-2xl font-heading font-bold text-slate-800">Login</h1><LoadingState /></CardBody></Card></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
