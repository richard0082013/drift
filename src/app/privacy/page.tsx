"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";

export default function PrivacyPage() {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return <main><p>Checking authentication...</p></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Privacy</h1>
        <p role="alert">Please log in to continue.</p>
        <Link href={buildLoginHref(pathname ?? "/privacy", "/privacy")}>Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Privacy</h1>
      <p>
        Drift is not a medical service and does not provide medical advice, diagnosis, or treatment.
      </p>
      <p>You can export your data or request account deletion from the account page.</p>
      <Link href="/account">Go to account actions</Link>
    </main>
  );
}
