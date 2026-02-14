import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCheckinInput } from "@/lib/validation/checkin";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";
import { trackMetricEvent } from "@/lib/metrics/events";

const toUtcDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export async function POST(request: Request) {
  const payload = await request.json();
  const validated = validateCheckinInput(payload);

  if (!validated.ok) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: validated.message } },
      { status: 400 }
    );
  }

  const userId = getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@local.drift`,
        name: "Drift User"
      }
    });

    const checkin = await db.dailyCheckin.create({
      data: {
        userId,
        date: toUtcDate(validated.data.date),
        energy: validated.data.energy,
        stress: validated.data.stress,
        social: validated.data.social,
        keyContact: validated.data.key_contact
      }
    });

    await trackMetricEvent({
      event: "checkin.create",
      actorId: userId,
      status: "success",
      target: userId,
      properties: {
        date: validated.data.date
      }
    });

    return NextResponse.json({ checkin }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE_CHECKIN",
            message: "A check-in for this date already exists."
          }
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to create check-in." } },
      { status: 500 }
    );
  }
}
