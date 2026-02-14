"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckinForm } from "@/components/checkin-form";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";

export default function CheckinPage() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setReady(true);
  }, []);

  if (!ready) {
    return <main><p>Checking authentication...</p></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Daily Check-in</h1>
        <p role="alert">Please log in to continue.</p>
        <Link href={buildLoginHref(pathname ?? "/checkin", "/checkin")}>Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Daily Check-in</h1>
      <p>Complete your daily check-in in under 10 seconds.</p>
      <p>Use neutral wording only and avoid entering highly sensitive personal details.</p>
      <CheckinForm />
    </main>
  );
}
