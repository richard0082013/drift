export type AlertPayload = {
  level: "low" | "moderate" | "high";
  message: string;
  reason: string;
  action: string;
};

export function generateAlertPayload(driftIndex: number, reasons: string[]): AlertPayload {
  const level = driftIndex >= 0.8 ? "high" : driftIndex >= 0.65 ? "moderate" : "low";
  const reason = reasons.join(" ") || "Recent signals suggest your routine may be shifting.";

  return {
    level,
    message:
      "This is a gentle check-in reminder: your recent pattern looks a bit off, and a small reset could help.",
    reason,
    action: "Try a short reset today: hydration, a brief walk, or a focused break."
  };
}
