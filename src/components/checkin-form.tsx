"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { buildSessionAuthorizationHeader } from "@/lib/auth/client-auth";
import { Button } from "@/components/ui/button";

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

function normalizeSubmitErrorMessage(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "Unable to submit check-in.";
  }

  if (/INTERNAL_ERROR/i.test(value)) {
    return "Unable to submit check-in.";
  }

  return value;
}

const scaleLabels = ["Very Low", "Low", "Moderate", "High", "Very High"];

type ScaleInputProps = {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  activeColor: string;
};

function ScaleInput({ label, ariaLabel, value, onChange, activeColor }: ScaleInputProps) {
  const numValue = Number(value) || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {numValue > 0 ? (
          <span className="text-xs text-slate-400">{scaleLabels[numValue - 1]}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={[
                "w-10 h-10 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-coral-300",
                numValue === n
                  ? `${activeColor} text-white shadow-md scale-110`
                  : "bg-cream-100 text-slate-600 hover:scale-105"
              ].join(" ")}
              onClick={() => onChange(String(n))}
              aria-label={`${label} ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
        <input
          aria-label={ariaLabel}
          type="number"
          min={1}
          max={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 text-center text-xs rounded-md border border-cream-200 bg-cream-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-coral-200"
        />
      </div>
    </div>
  );
}

type Props = {
  onSubmitSuccess?: (checkin: {
    energy: number;
    stress: number;
    social: number;
  }) => void;
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
        setError(normalizeSubmitErrorMessage(data.error?.message));
        return;
      }

      setSuccess("Check-in submitted successfully.");
      setForm(initialState);
      onSubmitSuccess?.({
        energy: data.checkin?.energy ?? Number(form.energy),
        stress: data.checkin?.stress ?? Number(form.stress),
        social: data.checkin?.social ?? Number(form.social)
      });
    } catch {
      setError("Unable to submit check-in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <ScaleInput
        label="Energy"
        ariaLabel="Energy (1-5)"
        value={form.energy}
        onChange={(val) => setForm((prev) => ({ ...prev, energy: val }))}
        activeColor="bg-coral-500"
      />
      <ScaleInput
        label="Stress"
        ariaLabel="Stress (1-5)"
        value={form.stress}
        onChange={(val) => setForm((prev) => ({ ...prev, stress: val }))}
        activeColor="bg-rose-500"
      />
      <ScaleInput
        label="Social"
        ariaLabel="Social (1-5)"
        value={form.social}
        onChange={(val) => setForm((prev) => ({ ...prev, social: val }))}
        activeColor="bg-sage-500"
      />

      <div className="space-y-1.5">
        <label htmlFor="key-contact" className="text-sm font-medium text-slate-700">
          Key Contact
        </label>
        <input
          id="key-contact"
          aria-label="Key Contact"
          value={form.key_contact}
          onChange={(e) => setForm((prev) => ({ ...prev, key_contact: e.target.value }))}
          placeholder="Who did you connect with today?"
          className="w-full px-3 py-2 rounded-lg text-sm text-slate-700 bg-white border border-cream-200 focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-400 transition-colors duration-200 placeholder:text-slate-400"
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full" size="lg">
        {submitting ? "Submitting..." : "Submit Check-in"}
      </Button>

      {error ? <p role="alert" className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p> : null}
      {success ? (
        <div className="flex items-center gap-2 text-sm text-sage-600 bg-sage-50 px-3 py-2 rounded-lg">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p>{success}</p>
        </div>
      ) : null}
    </form>
  );
}
