"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  getGoogleProvider,
} from "@/lib/firebase";
import { AuthModal } from "@/components/auth/AuthModal";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSigningIn: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  openAuthModal: (returnUrl?: string) => void;
  closeAuthModal: () => void;
  signInWithGoogle: (returnUrl?: string) => Promise<User | null>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AUTH_RETURN_URL_KEY = "suprilo_auth_return_url";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
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

  // Process redirect result on mount (for mobile fallback)
  React.useEffect(() => {
    let isMounted = true;
    const currentAuth = getFirebaseAuth();

    if (!currentAuth || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    getRedirectResult(currentAuth)
      .then((result) => {
        if (!isMounted) return;
        if (result?.user) {
          setUser(result.user);
          const savedReturnUrl = sessionStorage.getItem(AUTH_RETURN_URL_KEY);
          if (savedReturnUrl) {
            sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
            router.push(savedReturnUrl);
          }
        }
      })
      .catch((err: { code?: string; message?: string }) => {
        if (!isMounted) return;
        if (err.code !== "auth/popup-closed-by-user") {
          setError(getFriendlyErrorMessage(err.code));
        }
      });

    // Track authentication state changes
    const unsubscribe = onAuthStateChanged(currentAuth, (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  /**
   * Sign In with Google
   */
  const signInWithGoogle = React.useCallback(
    async (returnUrl?: string): Promise<User | null> => {
      if (isSigningIn) return null;

      const currentAuth = getFirebaseAuth();
      const currentProvider = getGoogleProvider();

      if (!currentAuth || !currentProvider || !isFirebaseConfigured()) {
        const msg = "Firebase is not configured. Please add your Firebase environment variables in Vercel settings.";
        setError(msg);
        return null;
      }

      setIsSigningIn(true);
      setError(null);

      if (returnUrl) {
        try {
          sessionStorage.setItem(AUTH_RETURN_URL_KEY, returnUrl);
        } catch {}
      } else {
        try {
          sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
        } catch {}
      }

      try {
        const result = await signInWithPopup(currentAuth, currentProvider);
        const signedInUser = result.user;
        setUser(signedInUser);

        if (returnUrl) {
          try {
            sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
          } catch {}
          router.push(returnUrl);
        }

        setIsSigningIn(false);
        return signedInUser;
      } catch (err: unknown) {
        const firebaseErr = err as { code?: string; message?: string };
        const code = firebaseErr?.code || "";

        // User intentionally closed the popup: stay on page silently
        if (
          code === "auth/popup-closed-by-user" ||
          code === "auth/cancelled-popup-request"
        ) {
          setIsSigningIn(false);
          return null;
        }

        // If popup is blocked by mobile browser, fallback to redirect
        if (code === "auth/popup-blocked") {
          try {
            await signInWithRedirect(currentAuth, currentProvider);
            return null;
          } catch {
            setError("Sign-in popup was blocked by your browser. Please allow popups and try again.");
          }
        } else {
          setError(getFriendlyErrorMessage(code));
        }

        setIsSigningIn(false);
        return null;
      }
    },
    [isSigningIn, router]
  );

  /**
   * Sign Out
   */
  const signOutUser = React.useCallback(async () => {
    const currentAuth = getFirebaseAuth();
    if (!currentAuth) {
      setUser(null);
      return;
    }
    try {
      await signOut(currentAuth);
      setUser(null);
      setError(null);
      try {
        sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
      } catch {}
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

function getFriendlyErrorMessage(code?: string): string {
  switch (code) {
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google Sign-In in Firebase Console. Please add localhost / your domain to Authorized Domains.";
    case "auth/operation-not-allowed":
      return "Google Sign-In is not enabled in Firebase Console. Please enable Google in Firebase Authentication -> Sign-in method.";
    case "auth/user-disabled":
      return "This user account has been disabled.";
    default:
      return "Unable to sign in with Google right now. Please try again.";
  }
}
