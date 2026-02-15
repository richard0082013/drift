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

  const energy = candidate.energy;
  if (typeof energy !== "number" || !isOneToFive(energy)) {
    return { ok: false, message: "energy must be an integer between 1 and 5." };
  }
  const stress = candidate.stress;
  if (typeof stress !== "number" || !isOneToFive(stress)) {
    return { ok: false, message: "stress must be an integer between 1 and 5." };
  }
  const social = candidate.social;
  if (typeof social !== "number" || !isOneToFive(social)) {
    return { ok: false, message: "social must be an integer between 1 and 5." };
  }

  if (candidate.key_contact != null && typeof candidate.key_contact !== "string") {
    return { ok: false, message: "key_contact must be a string." };
  }

  return {
    ok: true,
    data: {
      date: candidate.date,
      energy,
      stress,
      social,
      key_contact: candidate.key_contact as string | undefined
    }
  };
}
