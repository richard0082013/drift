import { sendEmailReminder } from "@/lib/notifications/provider-email";

export type ReminderDispatchInput = {
  userId: string;
  timezone: string;
  localDate: string;
  reminderHourLocal: number;
};

export type ReminderDispatchResult = {
  provider: "noop" | "email";
  delivered: boolean;
  messageId?: string;
};

export function getNotificationProvider(): "noop" | "email" {
  const provider = (process.env.NOTIFICATION_PROVIDER ?? "noop").trim().toLowerCase();
  return provider === "email" ? "email" : "noop";
}

export async function sendReminder(input: ReminderDispatchInput): Promise<ReminderDispatchResult> {
  const provider = getNotificationProvider();
  if (provider === "email") {
    const result = await sendEmailReminder(input);
    return {
      provider: "email",
      delivered: result.delivered,
      messageId: result.messageId
    };
  }

  return {
    provider: "noop",
    delivered: false
  };
}
