"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";
import { SupriloUser, normalizeSupabaseUser } from "@/lib/auth-user";

export type { SupriloUser };
export { normalizeSupabaseUser };

export interface AuthContextType {
  user: SupriloUser | null;
  loading: boolean;
  isSigningIn: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  openAuthModal: (returnUrl?: string) => void;
  closeAuthModal: () => void;
  signInWithGoogle: (returnUrl?: string) => Promise<SupriloUser | null>;
  signOutUser: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  clearError: () => void;
  setOptimisticProfile: (updates: { displayName?: string; photoURL?: string | null; bio?: string | null }) => void;
  refreshUser: () => Promise<void>;
}

function areUsersEqual(a: SupriloUser | null, b: SupriloUser | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.uid === b.uid &&
    a.email === b.email &&
    a.displayName === b.displayName &&
    a.photoURL === b.photoURL &&
    a.bio === b.bio
  );
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<SupriloUser | null>(null);

  const updateSafeUser = React.useCallback((next: SupriloUser | null) => {
    setUser((prev) => (areUsersEqual(prev, next) ? prev : next));
  }, []);
  const [loading, setLoading] = React.useState(true);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [authModalState, setAuthModalState] = React.useState<{
    isOpen: boolean;
    returnUrl?: string;
  }>({
    isOpen: false,
    returnUrl: "/create",
  });

  const openAuthModal = React.useCallback((returnUrl: string = "/create") => {
    setAuthModalState({ isOpen: true, returnUrl });
  }, []);

  const closeAuthModal = React.useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Initialize and synchronize Supabase authentication state
  React.useEffect(() => {
    let isMounted = true;
    let supabaseClient: ReturnType<typeof createClient>;

    try {
      supabaseClient = createClient();
    } catch (clientInitErr) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Supabase browser client initialization deferred:", clientInitErr);
      }
      setLoading(false);
      return;
    }

    // 1. Initial verified user check via getUser() (validates with auth server)
    supabaseClient.auth
      .getUser()
      .then(({ data: { user: initialUser }, error: getUserError }) => {
        if (!isMounted) return;
        if (!getUserError && initialUser) {
          updateSafeUser(normalizeSupabaseUser(initialUser));
        } else {
          updateSafeUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        updateSafeUser(null);
        setLoading(false);
      });

    // 2. Real-time auth listener for session events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        updateSafeUser(normalizeSupabaseUser(session.user));
      } else {
        updateSafeUser(null);
      }
      setLoading(false);
    });

    // 3. Cleanup subscription on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [updateSafeUser]);

  /**
   * Google OAuth 2.0 Sign-In via Supabase PKCE Authorization Flow.
   * Prioritizes a clean popup window so Google authentication URLs never pollute
   * the main browser tab history stack (preventing the back-button account chooser trap).
   * Gracefully falls back to standard full-page redirect if popups are blocked by the browser.
   */
  const signInWithGoogle = React.useCallback(
    async (returnUrl: string = "/create"): Promise<SupriloUser | null> => {
      if (isSigningIn) return null;

      setIsSigningIn(true);
      setError(null);

      let supabaseClient: ReturnType<typeof createClient>;
      try {
        supabaseClient = createClient();
      } catch {
        setError(
          "Supabase authentication is not configured. Please ensure environment variables are configured."
        );
        setIsSigningIn(false);
        return null;
      }

      try {
        const origin =
          typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "http://localhost:3000";

        // Sanitize destination to strictly relative path
        const safeDestination =
          returnUrl.startsWith("/") && !returnUrl.startsWith("//") && !returnUrl.startsWith("/\\")
            ? returnUrl
            : "/create";

        // 1. Request popup authorization URL from Supabase with popup=true
        const popupRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeDestination)}&popup=true`;

        const { data, error: oauthError } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: popupRedirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
            skipBrowserRedirect: true,
          },
        });

        if (oauthError) {
          setError(oauthError.message || "Failed to initiate Google Sign-In.");
          setIsSigningIn(false);
          return null;
        }

        if (!data?.url) {
          setError("Failed to generate Google Sign-In link.");
          setIsSigningIn(false);
          return null;
        }

        // 2. Open centered popup window
        const width = 500;
        const height = 620;
        const screenLeft = typeof window.screenLeft !== "undefined" ? window.screenLeft : window.screenX;
        const screenTop = typeof window.screenTop !== "undefined" ? window.screenTop : window.screenY;
        const innerWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
        const innerHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
        const left = screenLeft + Math.max(0, Math.floor((innerWidth - width) / 2));
        const top = screenTop + Math.max(0, Math.floor((innerHeight - height) / 2));

        let popup: Window | null = null;
        try {
          popup = window.open(
            data.url,
            "SupriloAuthPopup",
            `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
          );
        } catch {
          popup = null;
        }

        // 3. Fallback: If browser blocked popup window, perform standard full-page redirect
        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          const fallbackRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeDestination)}`;
          await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: fallbackRedirectTo,
              queryParams: {
                access_type: "offline",
                prompt: "select_account",
              },
            },
          });
          return null;
        }

        // 4. Await completion signal from popup or user cancellation
        return await new Promise<SupriloUser | null>((resolve) => {
          let isDone = false;
          let pollTimer: ReturnType<typeof setInterval> | null = null;
          let authChannel: BroadcastChannel | null = null;

          const finishAuth = async (success: boolean, errorMsg?: string) => {
            if (isDone) return;
            isDone = true;

            if (pollTimer) clearInterval(pollTimer);
            if (authChannel) {
              try { authChannel.close(); } catch {
                // Ignore channel closure errors
              }
            }
            window.removeEventListener("message", messageHandler);
            setIsSigningIn(false);

            if (popup && !popup.closed) {
              try { popup.close(); } catch {
                // Ignore popup closure errors
              }
            }

            if (!success) {
              if (errorMsg) setError(errorMsg);
              resolve(null);
              return;
            }

            try {
              const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
              const normalized = normalizeSupabaseUser(currentUser);
              updateSafeUser(normalized);
              closeAuthModal();

              if (safeDestination && window.location.pathname !== safeDestination) {
                router.push(safeDestination);
              }
              router.refresh();
              resolve(normalized);
            } catch {
              resolve(null);
            }
          };

          // A. Cross-window communication via BroadcastChannel
          try {
            if (typeof BroadcastChannel !== "undefined") {
              authChannel = new BroadcastChannel("suprilo_auth_channel");
              authChannel.onmessage = (event) => {
                if (event.data?.success) {
                  finishAuth(true);
                } else if (event.data?.error) {
                  finishAuth(false, "Authentication was cancelled or failed.");
                }
              };
            }
          } catch {
            // BroadcastChannel unavailable in this browser environment
          }

          // B. Cross-window communication via postMessage
          const messageHandler = (event: MessageEvent) => {
            if (event.origin !== origin) return;
            if (event.data?.success) {
              finishAuth(true);
            } else if (event.data?.error) {
              finishAuth(false, "Authentication was cancelled or failed.");
            }
          };
          window.addEventListener("message", messageHandler);

          // C. Detect user manually closing the popup window before completing OAuth
          pollTimer = setInterval(() => {
            if (popup.closed) {
              if (pollTimer) clearInterval(pollTimer);
              setTimeout(() => {
                if (!isDone) {
                  finishAuth(false);
                }
              }, 400);
            }
          }, 500);
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to sign in with Google right now. Please try again.";
        setError(message);
        setIsSigningIn(false);
        return null;
      }
    },
    [isSigningIn, closeAuthModal, router, updateSafeUser]
  );

  /**
   * Retrieves fresh Supabase session JWT for authenticated API requests
   */
  const getIdToken = React.useCallback(async (): Promise<string | null> => {
    try {
      const supabaseClient = createClient();
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Sign out of Supabase session and clear client state
   */
  const signOutUser = React.useCallback(async () => {
    try {
      const supabaseClient = createClient();
      await supabaseClient.auth.signOut();
      setUser(null);
      setError(null);
    } catch {
      setError("Unable to sign out right now. Please check your connection.");
    }
  }, []);

  const setOptimisticProfile = React.useCallback(
    (updates: { displayName?: string; photoURL?: string | null; bio?: string | null }) => {
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          displayName: updates.displayName !== undefined ? updates.displayName : prev.displayName,
          photoURL: updates.photoURL !== undefined ? updates.photoURL : prev.photoURL,
          bio: updates.bio !== undefined ? updates.bio : prev.bio,
        };
      });
    },
    []
  );

  const refreshUser = React.useCallback(async () => {
    try {
      const supabaseClient = createClient();
      const {
        data: { user: latestUser },
      } = await supabaseClient.auth.getUser();
      if (latestUser) {
        updateSafeUser(normalizeSupabaseUser(latestUser));
      }
    } catch {
      // Safe fallback
    }
  }, [updateSafeUser]);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      isSigningIn,
      error,
      isAuthModalOpen: authModalState.isOpen,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signOutUser,
      getIdToken,
      clearError,
      setOptimisticProfile,
      refreshUser,
    }),
    [
      user,
      loading,
      isSigningIn,
      error,
      authModalState.isOpen,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signOutUser,
      getIdToken,
      clearError,
      setOptimisticProfile,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={closeAuthModal}
        returnUrl={authModalState.returnUrl}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
