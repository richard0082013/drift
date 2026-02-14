type CheckinPoint = {
  date: Date;
  energy: number;
  stress: number;
  social: number;
};

type WeeklySummary = {
  checkinCount: number;
  avgEnergy: number;
  avgStress: number;
  avgSocial: number;
  trend: "improving" | "stable" | "worsening";
};

type WeeklyInsights = {
  summary: WeeklySummary;
  recommendations: string[];
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trendOf(points: CheckinPoint[]): WeeklySummary["trend"] {
  if (points.length < 4) {
    return "stable";
  }

  const pivot = Math.floor(points.length / 2);
  const left = points.slice(0, pivot);
  const right = points.slice(pivot);

  const score = (items: CheckinPoint[]) =>
    average(items.map((item) => item.energy + item.social - item.stress));

  const delta = score(right) - score(left);
  if (delta > 0.4) {
    return "improving";
  }
  if (delta < -0.4) {
    return "worsening";
  }
  return "stable";
}

export function buildWeeklyInsights(points: CheckinPoint[]): WeeklyInsights {
  const avgEnergy = round1(average(points.map((item) => item.energy)));
  const avgStress = round1(average(points.map((item) => item.stress)));
  const avgSocial = round1(average(points.map((item) => item.social)));
  const trend = trendOf(points);

  const recommendations: string[] = [];
  if (points.length === 0) {
    recommendations.push("Start daily check-ins this week to unlock personalized insights.");
    recommendations.push("Aim for one short reflection at the same time each day.");
  } else {
    if (trend === "worsening") {
      recommendations.push("Your recent pattern is trending down; plan one recovery block this week.");
    }
    if (avgStress >= 4) {
      recommendations.push("Stress is elevated; add a brief decompression routine after work.");
    }
    if (avgEnergy <= 2.5) {
      recommendations.push("Energy is low; protect sleep and schedule one low-effort reset activity.");
    }
    if (avgSocial <= 2.5) {
      recommendations.push("Social signal is low; schedule one meaningful check-in with a trusted contact.");
    }
  }

  if (recommendations.length < 2) {
    recommendations.push("Keep your check-ins consistent to increase signal quality.");
  }
  if (recommendations.length < 2) {
    recommendations.push("Review your week every Sunday and choose one small improvement for next week.");
  }

  return {
    summary: {
      checkinCount: points.length,
      avgEnergy,
      avgStress,
      avgSocial,
      trend
    },
    recommendations: recommendations.slice(0, 3)
  };
}
