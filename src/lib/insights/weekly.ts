export type WeeklyCheckinPoint = {
  date: Date;
  energy: number;
  stress: number;
  social: number;
};

export type WeeklyDriftPoint = {
  date: Date;
  driftIndex: number;
  reasonsJson: unknown;
};

export type WeeklyAlertPoint = {
  date: Date;
  level: string;
};

type WeeklyInsightsInput = {
  checkins: WeeklyCheckinPoint[];
  driftScores: WeeklyDriftPoint[];
  alerts: WeeklyAlertPoint[];
  start: Date;
  end: Date;
  days: number;
};

type WeeklyAverages = {
  energy: number | null;
  stress: number | null;
  social: number | null;
  driftIndex: number | null;
};

export type WeeklyInsights = {
  weekStart: string;
  weekEnd: string;
  days: number;
  summary: {
    checkinCount: number;
    alertCount: number;
    averages: WeeklyAverages;
    driftLevel: "low" | "moderate" | "high";
    hasEnoughData: boolean;
  };
  highlights: string[];
  suggestions: string[];
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce((acc, current) => acc + current, 0);
  return round1(sum / values.length);
}

function deriveDriftLevel(avgDrift: number | null): "low" | "moderate" | "high" {
  if (avgDrift === null) {
    return "low";
  }

  if (avgDrift >= 0.7) {
    return "high";
  }

  if (avgDrift >= 0.45) {
    return "moderate";
  }

  return "low";
}

function buildHighlights(
  avgDrift: number | null,
  alerts: WeeklyAlertPoint[],
  checkinCount: number,
  days: number
) {
  const highlights: string[] = [];

  if (checkinCount === 0) {
    highlights.push("No check-ins were recorded this week.");
    return highlights;
  }

  highlights.push(`${checkinCount}/${days} check-ins completed in this window.`);

  if (alerts.length > 0) {
    highlights.push(`${alerts.length} reminder/alert event(s) were captured.`);
  }

  if (avgDrift !== null) {
    highlights.push(`Average drift index is ${avgDrift.toFixed(1)}.`);
  }

  return highlights.slice(0, 3);
}

function buildSuggestions(averages: WeeklyAverages, driftLevel: "low" | "moderate" | "high") {
  const suggestions: string[] = [];

  if (averages.energy !== null && averages.energy < 3) {
    suggestions.push("Energy is trending low; schedule a short recovery block tomorrow.");
  }

  if (averages.stress !== null && averages.stress > 3) {
    suggestions.push("Stress stayed elevated; plan one decompression habit this evening.");
  }

  if (averages.social !== null && averages.social < 3) {
    suggestions.push("Social score dipped; add one meaningful check-in with your key contact.");
  }

  if (driftLevel === "high") {
    suggestions.push("Drift risk is high; keep tomorrow lighter and review your warning signals.");
  }

  if (driftLevel === "moderate") {
    suggestions.push("Drift risk is moderate; protect one stable routine for the next two days.");
  }

  if (suggestions.length < 2) {
    suggestions.push("Keep your next check-in consistent to maintain trend quality.");
  }

  if (suggestions.length < 2) {
    suggestions.push("Use this summary as a baseline and compare again in 7 days.");
  }

  return suggestions.slice(0, 3);
}

export function buildWeeklyInsights(input: WeeklyInsightsInput): WeeklyInsights {
  const checkinCount = input.checkins.length;
  const averages: WeeklyAverages = {
    energy: average(input.checkins.map((item) => item.energy)),
    stress: average(input.checkins.map((item) => item.stress)),
    social: average(input.checkins.map((item) => item.social)),
    driftIndex: average(input.driftScores.map((item) => item.driftIndex))
  };

  const driftLevel = deriveDriftLevel(averages.driftIndex);

  return {
    weekStart: dateKey(input.start),
    weekEnd: dateKey(input.end),
    days: input.days,
    summary: {
      checkinCount,
      alertCount: input.alerts.length,
      averages,
      driftLevel,
      hasEnoughData: checkinCount >= 3
    },
    highlights: buildHighlights(averages.driftIndex, input.alerts, checkinCount, input.days),
    suggestions: buildSuggestions(averages, driftLevel)
  };
}
