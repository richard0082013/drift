export type EmailReminderPayload = {
  userId: string;
  timezone: string;
  localDate: string;
  reminderHourLocal: number;
};

export async function sendEmailReminder(payload: EmailReminderPayload) {
  const to = process.env.REMINDER_EMAIL_TO ?? `${payload.userId}@local.drift`;
  return {
    delivered: true,
    provider: "email" as const,
    to,
    messageId: `email-${payload.userId}-${Date.now()}`
  };
}
