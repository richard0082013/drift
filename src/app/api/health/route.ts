import { getSessionUserId } from "@/lib/auth/session";
import { createRequestMeta, successJson } from "@/lib/http/response-contract";

export async function GET(request: Request) {
  const meta = createRequestMeta(request);
  const userId = getSessionUserId(request);

  return successJson(
    {
      status: "ok",
      authenticated: Boolean(userId),
      session: {
        userId: userId ?? null
      }
    },
    meta
  );
}
