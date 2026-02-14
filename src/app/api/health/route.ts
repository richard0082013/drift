import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserId(request);

  return NextResponse.json(
    {
      status: "ok",
      authenticated: Boolean(userId),
      session: {
        userId: userId ?? null
      },
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
