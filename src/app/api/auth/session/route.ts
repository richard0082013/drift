import { getSessionUserId } from "@/lib/auth/session";
import { createRequestMeta, errorJson, successJson } from "@/lib/http/response-contract";
import { getUserTier } from "@/lib/subscription/tier";

export async function GET(request: Request) {
  const meta = createRequestMeta(request);
  const userId = getSessionUserId(request);
  if (!userId) {
    return errorJson("UNAUTHORIZED", "Authentication required.", meta, 401);
  }
  const tier = await getUserTier(userId);

  return successJson(
    {
      authenticated: true,
      session: { userId, tier }
    },
    meta
  );
}
