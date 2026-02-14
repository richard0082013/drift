import { NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  return NextResponse.json({ session: { userId } }, { status: 200 });
}
