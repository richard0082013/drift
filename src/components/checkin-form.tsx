"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { buildSessionAuthorizationHeader } from "@/lib/auth/client-auth";

type FormState = {
  energy: string;
  stress: string;
  social: string;
  key_contact: string;
};

const initialState: FormState = {
  energy: "",
  stress: "",
  social: "",
  key_contact: ""
};

function validateRange(name: string, value: string): string | null {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) {
    return `${name} must be between 1 and 5.`;
  }
  return null;
}

type Props = {
  onSubmitSuccess?: () => void;
};

export function CheckinForm({ onSubmitSuccess }: Props) {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const validations = useMemo(
    () => [
      validateRange("Energy", form.energy),
      validateRange("Stress", form.stress),
      validateRange("Social", form.social)
    ],
    [form.energy, form.stress, form.social]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const firstError = validations.find(Boolean);
    if (firstError) {
      setError(firstError);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...buildSessionAuthorizationHeader()
        },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          energy: Number(form.energy),
          stress: Number(form.stress),
          social: Number(form.social),
          key_contact: form.key_contact.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? "Unable to submit check-in.");
        return;
      }

      setSuccess("Check-in submitted successfully.");
      setForm(initialState);
      onSubmitSuccess?.();
    } catch {
      setError("Unable to submit check-in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label>
        Energy (1-5)
        <input
          aria-label="Energy (1-5)"
          value={form.energy}
          onChange={(e) => setForm((prev) => ({ ...prev, energy: e.target.value }))}
        />
      </label>
      <label>
        Stress (1-5)
        <input
          aria-label="Stress (1-5)"
          value={form.stress}
          onChange={(e) => setForm((prev) => ({ ...prev, stress: e.target.value }))}
        />
      </label>
      <label>
        Social (1-5)
        <input
          aria-label="Social (1-5)"
          value={form.social}
          onChange={(e) => setForm((prev) => ({ ...prev, social: e.target.value }))}
        />
      </label>
      <label>
        Key Contact
        <input
          aria-label="Key Contact"
          value={form.key_contact}
          onChange={(e) => setForm((prev) => ({ ...prev, key_contact: e.target.value }))}
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Check-in"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </form>
  );
}
