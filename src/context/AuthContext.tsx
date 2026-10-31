"use client";

import * as React from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";

/**
 * Normalized application-level user model.
 * Preserves complete backward compatibility with existing components (Navbar, UserAvatar,
 * Profile, Card Studio, Template Gallery) while backed purely by Supabase Auth.
 */
export interface SupriloUser {
  id: string; // Supabase user UUID
  uid: string; // Backward-compatible alias of id
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  metadata: {
    creationTime: string; // ISO 8601 timestamp string from created_at
    lastSignInTime: string; // ISO 8601 timestamp string from last_sign_in_at
  };
}

/**
 * Transforms a Supabase Auth user into the normalized application SupriloUser format.
 * Safely handles missing, null, or undefined OAuth provider metadata.
 */
export function normalizeSupabaseUser(user: SupabaseUser | null): SupriloUser | null {
  if (!user) return null;

  const userMeta = user.user_metadata || {};

  // Resolve display name across standard Google OAuth metadata conventions
  const displayName =
    (typeof userMeta.full_name === "string" && userMeta.full_name.trim()) ||
    (typeof userMeta.name === "string" && userMeta.name.trim()) ||
    (typeof userMeta.given_name === "string" && userMeta.given_name.trim()) ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Creator";

  // Resolve avatar URL across standard Google OAuth metadata conventions
  const photoURL =
    (typeof userMeta.avatar_url === "string" && userMeta.avatar_url) ||
    (typeof userMeta.picture === "string" && userMeta.picture) ||
    null;

  const creationTime = user.created_at || new Date().toISOString();
  const lastSignInTime = user.last_sign_in_at || creationTime;

  return {
    id: user.id,
    uid: user.id,
    email: user.email || null,
    displayName,
    photoURL,
    metadata: {
      creationTime,
      lastSignInTime,
    },
  };
}

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
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SupriloUser | null>(null);
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
          setUser(normalizeSupabaseUser(initialUser));
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setUser(null);
        setLoading(false);
      });

    // 2. Real-time auth listener for session events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(normalizeSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 3. Cleanup subscription on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Google OAuth 2.0 Sign-In via Supabase PKCE Authorization Flow.
   * Redirects user through /auth/callback with the sanitized destination.
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

        const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeDestination)}`;

        const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

        if (oauthError) {
          setError(oauthError.message || "Failed to initiate Google Sign-In.");
          setIsSigningIn(false);
          return null;
        }

        // Browser redirects to Google OAuth screen; return null during redirect
        return null;
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
    [isSigningIn]
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
