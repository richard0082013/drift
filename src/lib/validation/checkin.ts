export type CheckinInput = {
  date: string;
  energy: number;
  stress: number;
  social: number;
  key_contact?: string;
};

const isOneToFive = (value: number) => Number.isInteger(value) && value >= 1 && value <= 5;

export function validateCheckinInput(payload: unknown):
  | { ok: true; data: CheckinInput }
  | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Request body must be an object." };
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.date !== "string" || Number.isNaN(Date.parse(candidate.date))) {
    return { ok: false, message: "date is required in ISO format." };
  }

  for (const key of ["energy", "stress", "social"] as const) {
    if (typeof candidate[key] !== "number" || !isOneToFive(candidate[key])) {
      return { ok: false, message: `${key} must be an integer between 1 and 5.` };
    }
  }

  if (candidate.key_contact != null && typeof candidate.key_contact !== "string") {
    return { ok: false, message: "key_contact must be a string." };
  }

  return {
    ok: true,
    data: {
      date: candidate.date,
      energy: candidate.energy,
      stress: candidate.stress,
      social: candidate.social,
      key_contact: candidate.key_contact as string | undefined
    }
  };
}
