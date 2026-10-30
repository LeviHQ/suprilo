import type { User } from "firebase/auth";

export type AuthUserLike =
  | User
  | { getIdToken: (forceRefresh?: boolean) => Promise<string | null> }
  | null;

/**
 * Reusable client-side API helper.
 * Automatically attaches the user's Firebase ID token in the Authorization Bearer header.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  user: AuthUserLike,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (user) {
    try {
      const token = await user.getIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch {
      // Continue without token if retrieval fails
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
