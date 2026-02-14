"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";
import {
  AuthRequiredState,
  ErrorState,
  LoadingState
} from "@/components/page-feedback";

type ExportMetadata = {
  generatedAt: string;
  recordCount: string;
  version: string;
};

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
  const [exportMetadata, setExportMetadata] = useState<ExportMetadata | null>(null);

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
    setExportMetadata(null);
    setExporting(true);

    try {
      const response = await fetch("/api/export", { method: "GET" });
      if (!response.ok) {
        setError("Unable to export data right now.");
        return;
      }

      setExportMetadata({
        generatedAt: response.headers.get("x-export-generated-at") ?? "unknown",
        recordCount: response.headers.get("x-export-record-count") ?? "unknown",
        version: response.headers.get("x-export-version") ?? "unknown"
      });
      setSuccess("Export generated.");
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

      const payload = (await response.json().catch(() => null)) as { purgeAfter?: unknown } | null;
      const purgeAfter =
        payload && typeof payload.purgeAfter === "string" ? payload.purgeAfter : "the retention window end";
      setSuccess(`Account entered retention window and is scheduled for purge after ${purgeAfter}.`);
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
    return <main><LoadingState /></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Account</h1>
        <AuthRequiredState loginHref={buildLoginHref(pathname ?? "/account", "/account")} />
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
          {exporting ? "Submitting..." : "Export my data"}
        </button>
        {exportMetadata ? (
          <dl>
            <dt>Generated at</dt>
            <dd>{exportMetadata.generatedAt}</dd>
            <dt>Record count</dt>
            <dd>{exportMetadata.recordCount}</dd>
            <dt>Version</dt>
            <dd>{exportMetadata.version}</dd>
          </dl>
        ) : null}
      </section>

      <section>
        <h2>Delete Account</h2>
        <p>Deletion is soft-first. Your account enters a retention window before permanent purge.</p>
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
            {deleting ? "Submitting..." : "Delete account"}
          </button>
        </form>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {success ? <p>{success}</p> : null}
      <p>If you need to restore access during the retention window, contact support.</p>
    </main>
  );
}
