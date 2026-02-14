export type DriftSample = {
  energy: number;
  stress: number;
  social: number;
};

export type RuleResult = {
  rule: "energy" | "stress" | "social";
  triggered: boolean;
  score: number;
  reason?: string;
};

function splitWindow(data: DriftSample[]) {
  const windowSize = Math.min(3, Math.floor(data.length / 2));
  if (windowSize < 2) {
    return null;
  }

  const previous = data.slice(-(windowSize * 2), -windowSize);
  const current = data.slice(-windowSize);
  return { previous, current };
}

function avg(values: number[]) {
  return values.reduce((acc, item) => acc + item, 0) / values.length;
}

export function evaluateEnergyDowntrend(data: DriftSample[]): RuleResult {
  const windows = splitWindow(data);
  if (!windows) {
    return { rule: "energy", triggered: false, score: 0 };
  }

  const prev = avg(windows.previous.map((item) => item.energy));
  const current = avg(windows.current.map((item) => item.energy));
  const delta = prev - current;

  if (delta < 0.75) {
    return { rule: "energy", triggered: false, score: 0 };
  }

  const score = Math.min(1, delta / 3);
  return {
    rule: "energy",
    triggered: true,
    score,
    reason: "Energy has trended down over recent check-ins."
  };
}

export function evaluateStressUptrend(data: DriftSample[]): RuleResult {
  const windows = splitWindow(data);
  if (!windows) {
    return { rule: "stress", triggered: false, score: 0 };
  }

  const prev = avg(windows.previous.map((item) => item.stress));
  const current = avg(windows.current.map((item) => item.stress));
  const delta = current - prev;

  if (delta < 0.75) {
    return { rule: "stress", triggered: false, score: 0 };
  }

  const score = Math.min(1, delta / 3);
  return {
    rule: "stress",
    triggered: true,
    score,
    reason: "Stress has increased across recent check-ins."
  };
}

export function evaluateSocialDecline(data: DriftSample[]): RuleResult {
  const windows = splitWindow(data);
  if (!windows) {
    return { rule: "social", triggered: false, score: 0 };
  }

  const prev = avg(windows.previous.map((item) => item.social));
  const current = avg(windows.current.map((item) => item.social));
  const delta = prev - current;

  if (delta < 0.75) {
    return { rule: "social", triggered: false, score: 0 };
  }

  const score = Math.min(1, delta / 3);
  return {
    rule: "social",
    triggered: true,
    score,
    reason: "Social connection score has declined recently."
  };
}
