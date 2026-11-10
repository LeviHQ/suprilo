// Server-Side Safe Action URL Derivation for Notifications
// Spec Reference: SPEC-2C-5.7.5-REV6

export const SAFE_ALLOWLISTED_PATHS = [
  "/profile",
  "/profile/badges",
  "/profile/notifications",
  "/profile/settings",
  "/profile/analytics",
  "/templates",
  "/create",
] as const;

/**
 * Derives a strictly validated internal action URL for notification navigation.
 * Never trusts arbitrary external URLs, javascript: URIs, or protocol handlers in metadata.
 */
export function deriveSafeActionUrl(
  type: string,
  metadata?: unknown
): string | null {
  const meta = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : null;

  if (type === "CARD_REVEAL") {
    if (meta && typeof meta.card_id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(meta.card_id)) {
      return `/c/${meta.card_id}`;
    }
    return "/profile";
  }

  if (type === "BADGE_UNLOCKED") {
    if (meta && typeof meta.badge_id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(meta.badge_id)) {
      return `/b/${meta.badge_id}`;
    }
    return "/profile/badges";
  }

  if (type === "LEVEL_UP") {
    return "/profile";
  }

  if (type === "SYSTEM") {
    if (meta && typeof meta.url === "string") {
      const trimmedUrl = meta.url.trim();
      if (
        trimmedUrl.startsWith("/profile/settings#") ||
        (SAFE_ALLOWLISTED_PATHS as readonly string[]).includes(trimmedUrl)
      ) {
        return trimmedUrl;
      }
    }
    return "/profile";
  }

  return null;
}

