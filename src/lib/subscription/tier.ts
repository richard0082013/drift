export type UserTier = "free" | "pro";

/**
 * v1 tier resolver for mobile integration.
 *
 * This intentionally returns a fixed tier for all users until billing and
 * subscription persistence are implemented.
 */
export async function getUserTier(_userId: string): Promise<UserTier> {
  return "free";
}
