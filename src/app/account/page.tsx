"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";

export default function AccountPage() {
  const DELETE_COUNTDOWN_SECONDS = 5;
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmArmed, setConfirmArmed] = useState(false);
  const [countdown, setCountdown] = useState(0);
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

  useEffect(() => {
    if (!confirmArmed || countdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [confirmArmed, countdown]);

  const canDelete = confirmText === "DELETE" && confirmArmed && countdown === 0;

  function onArmDelete() {
    setError(null);
    setSuccess(null);
    setConfirmArmed(true);
    setCountdown(DELETE_COUNTDOWN_SECONDS);
  }

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
        setSuccess(
          "Deletion failed. You can retry after reviewing your connection and confirmation details."
        );
        return;
      }

      setSuccess("Account deletion request submitted.");
      setConfirmText("");
      setConfirmArmed(false);
      setCountdown(0);
    } catch {
      setError("Unable to delete account right now.");
      setSuccess(
        "Deletion failed. You can retry after reviewing your connection and confirmation details."
      );
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
        {!confirmArmed ? (
          <button type="button" onClick={onArmDelete}>
            Start delete confirmation
          </button>
        ) : null}
        {confirmArmed && countdown > 0 ? (
          <p>Delete confirmation unlocks in {countdown}s.</p>
        ) : null}
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
