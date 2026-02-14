"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";
import { AuthRequiredState, LoadingState } from "@/components/page-feedback";

export default function PrivacyPage() {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      const loggedIn = await isLoggedIn();
      if (!active) {
        return;
      }

      setAuthenticated(loggedIn);
      setAuthChecked(true);
    }

    resolveSession();

    return () => {
      active = false;
    };
  }, []);

  if (!authChecked) {
    return <main><LoadingState /></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Privacy</h1>
        <AuthRequiredState loginHref={buildLoginHref(pathname ?? "/privacy", "/privacy")} />
      </main>
    );
  }

  return (
    <main>
      <h1>Privacy</h1>
      <p>
        Drift is not a medical service and does not provide medical advice, diagnosis, or treatment.
      </p>
      <p>
        Account deletion uses a soft-delete retention window before permanent purge. During this window,
        restoration can be requested through support.
      </p>
      <p>You can export your data or request account deletion from the account page.</p>
      <Link href="/account">Go to account actions</Link>
    </main>
  );
}
