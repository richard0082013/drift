import { describe, expect, it } from "vitest";
import {
  evaluateEnergyDowntrend,
  evaluateStressUptrend,
  evaluateSocialDecline
} from "@/lib/drift/rules";
import { calculateDrift } from "@/lib/drift/engine";

const sample = [
  { energy: 5, stress: 1, social: 5 },
  { energy: 5, stress: 2, social: 5 },
  { energy: 4, stress: 2, social: 4 },
  { energy: 3, stress: 3, social: 3 },
  { energy: 2, stress: 4, social: 2 },
  { energy: 1, stress: 5, social: 1 }
];

describe("drift rules", () => {
  it("detects energy downtrend", () => {
    const result = evaluateEnergyDowntrend(sample);
    expect(result.triggered).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it("detects stress uptrend", () => {
    const result = evaluateStressUptrend(sample);
    expect(result.triggered).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it("detects social decline", () => {
    const result = evaluateSocialDecline(sample);
    expect(result.triggered).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it("returns no drift for stable data", () => {
    const stable = [
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 }
    ];

    const result = calculateDrift(stable);
    expect(result.driftIndex).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("combines reasons and drift index", () => {
    const result = calculateDrift(sample);
    expect(result.driftIndex).toBeGreaterThanOrEqual(0.65);
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });
});
