import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";

const NOT_FOUND_ERROR = {
  error: {
    code: "ACCOUNT_NOT_FOUND",
    message: "Account does not exist."
  }
};

async function handleDelete(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    await db.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      deleted: true,
      strategy: "hard"
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json(NOT_FOUND_ERROR, { status: 404 });
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to delete account."
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handleDelete(request);
}

export async function DELETE(request: Request) {
  return handleDelete(request);
}
