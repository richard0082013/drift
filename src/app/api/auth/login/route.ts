import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueSessionCookie } from "@/lib/auth/session";

type LoginPayload = {
  email?: string;
  name?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = payload.email?.trim().toLowerCase() ?? "";
  const name = payload.name?.trim() ?? "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "A valid email is required."
        }
      },
      { status: 400 }
    );
  }

  const user = await db.user.upsert({
    where: { email },
    update: {
      name: name || undefined
    },
    create: {
      email,
      name: name || undefined
    }
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
  response.headers.append("set-cookie", issueSessionCookie(user.id));
  return response;
}
