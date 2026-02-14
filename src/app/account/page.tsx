"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";

export default function AccountPage() {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const canDelete = confirmText === "DELETE";

  async function onExport() {
    setError(null);
    setSuccess(null);
    setExporting(true);

    try {
      const response = await fetch("/api/export", { method: "GET" });
      if (!response.ok) {
        setError("Unable to export data right now.");
        return;
      }

      setSuccess("Export request started.");
    } catch {
      setError("Unable to export data right now.");
    } finally {
      setExporting(false);
    }
  }

  async function onDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canDelete) {
      setError("Type DELETE to confirm account deletion.");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      if (!response.ok) {
        setError("Unable to delete account right now.");
        return;
      }

      setSuccess("Account deletion request submitted.");
      setConfirmText("");
    } catch {
      setError("Unable to delete account right now.");
    } finally {
      setDeleting(false);
    }
  }

  if (!authChecked) {
    return <main><p>Checking authentication...</p></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Account</h1>
        <p role="alert">Please log in to continue.</p>
        <Link href={buildLoginHref(pathname ?? "/account", "/account")}>Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Account</h1>
      <p>Use this page to export your data and manage deletion requests.</p>

      <section>
        <h2>Export Data</h2>
        <button type="button" onClick={onExport} disabled={exporting}>
          {exporting ? "Exporting..." : "Export my data"}
        </button>
      </section>

      <section>
        <h2>Delete Account</h2>
        <p>Danger zone. This action cannot be undone.</p>
        <form onSubmit={onDelete}>
          <label>
            Type DELETE to confirm
            <input
              aria-label="Type DELETE to confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
            />
          </label>
          <button type="submit" disabled={!canDelete || deleting}>
            {deleting ? "Deleting..." : "Delete account"}
          </button>
        </form>
      </section>

      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </main>
  );
}
