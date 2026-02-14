import {
  DriftSample,
  RuleResult,
  evaluateEnergyDowntrend,
  evaluateSocialDecline,
  evaluateStressUptrend
} from "@/lib/drift/rules";

export type DriftEvaluation = {
  driftIndex: number;
  reasons: string[];
  rules: RuleResult[];
};

const WEIGHT: Record<RuleResult["rule"], number> = {
  energy: 0.35,
  stress: 0.35,
  social: 0.3
};

export function calculateDrift(data: DriftSample[]): DriftEvaluation {
  const rules = [
    evaluateEnergyDowntrend(data),
    evaluateStressUptrend(data),
    evaluateSocialDecline(data)
  ];

  const driftIndex = Number(
    rules
      .reduce((acc, rule) => acc + rule.score * WEIGHT[rule.rule], 0)
      .toFixed(3)
  );

  return {
    driftIndex,
    reasons: rules.filter((rule) => rule.triggered && rule.reason).map((rule) => rule.reason as string),
    rules
  };
}
