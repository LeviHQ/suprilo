"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Laptop,
  Globe,
  LogOut,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

function parseClientDevice(): { os: string; browser: string; isMobile: boolean } {
  if (typeof window === "undefined" || !navigator) {
    return { os: "Current Operating System", browser: "Current Web Browser", isMobile: false };
  }

  const ua = navigator.userAgent;

  // OS detection
  let os = "Unknown OS";
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10 / 11";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Browser detection
  let browser = "Unknown Browser";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Google Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Apple Safari";
  else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";
  else if (/Opera|OPR\//i.test(ua)) browser = "Opera";

  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

  return { os, browser, isMobile };
}

export function SecuritySessionCard() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [deviceInfo, setDeviceInfo] = React.useState<{ os: string; browser: string; isMobile: boolean }>({
    os: "Detecting device...",
    browser: "Detecting browser...",
    isMobile: false,
  });
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    setDeviceInfo(parseClientDevice());
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      router.push("/");
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <div
      id="security-session"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-warm-border/60 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-brand-dark tracking-tight inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>Security & Active Session</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 whitespace-nowrap shrink-0">
              Authenticated
            </span>
          </h3>
          <p className="text-xs text-brand-muted mt-1">
            Manage your authenticated session, verified authentication provider, and sign-out actions.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Grid: Connected Provider & Current Device */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Connected Provider */}
        <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2">
          <div className="flex items-center justify-between text-xs text-brand-muted font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Authentication Provider</span>
            </span>
            {user?.isGoogleVerified && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap shrink-0">
                Verified
              </span>
            )}
          </div>

          <p className="font-bold text-sm text-brand-dark flex items-center gap-2">
            <span>Google OAuth 2.0</span>
          </p>
          <p className="text-xs text-brand-muted truncate" title={user?.email || ""}>
            {user?.email || "No email available"}
          </p>
          <span className="text-[10px] text-brand-muted block pt-1 border-t border-brand-warm-border/50">
            Managed via Google PKCE OAuth. Password security and 2FA are handled by your Google Account.
          </span>
        </div>

        {/* Current Device & Browser */}
        <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2">
          <div className="flex items-center justify-between text-xs text-brand-muted font-semibold">
            <span className="flex items-center gap-1.5">
              {deviceInfo.isMobile ? (
                <Smartphone className="w-3.5 h-3.5 text-brand-pink" />
              ) : (
                <Laptop className="w-3.5 h-3.5 text-brand-pink" />
              )}
              <span>Current Device Session</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Active Now</span>
            </span>
          </div>

          <p className="font-bold text-sm text-brand-dark flex items-center gap-2">
            <span>{deviceInfo.os}</span>
          </p>
          <p className="text-xs text-brand-muted flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-muted shrink-0" />
            <span className="truncate">{deviceInfo.browser}</span>
          </p>
          <span className="text-[10px] text-brand-muted block pt-1 border-t border-brand-warm-border/50">
            Detected from current browser environment with HttpOnly session token storage.
          </span>
        </div>
      </div>

      {/* Sign Out Action Bar */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-brand-warm-border/60">
        <div>
          <h4 className="text-sm font-bold text-brand-dark">Sign Out of Session</h4>
          <p className="text-xs text-brand-muted">
            Securely terminates your active Supabase session and clears authenticated client state.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 gap-1.5 text-xs self-start sm:self-auto"
        >
          {isSigningOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
        </Button>
      </div>
    </div>
  );
}

