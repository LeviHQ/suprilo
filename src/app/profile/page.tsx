"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LogOut,
  Sparkles,
  Lock,
  PlusCircle,
  Calendar,
  Layers,
  Activity,
  Bookmark,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, isSigningIn, signInWithGoogle, signOutUser } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-warm flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-brand-dark">Loading your profile dashboard...</p>
        </div>
      </div>
    );
  }

  // Logged-out Auth Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-brand-warm flex flex-col">
        <header className="h-16 border-b border-brand-warm-border bg-white px-4">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="relative h-8 w-24">
              <Image src="/brand/logo.png" alt="Suprilo" fill className="object-contain" priority />
            </div>
            <div className="w-16" />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-brand-warm-border shadow-card text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <Badge variant="purple">Sign In Required</Badge>
              <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                Your Profile Dashboard
              </h1>
              <p className="text-sm text-brand-muted leading-relaxed">
                Sign in with Google to view your account details, manage created cards, and access custom surprise templates.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => signInWithGoogle("/profile")}
                disabled={isSigningIn}
                className="w-full justify-center gap-2.5 shadow-md"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>{isSigningIn ? "Signing in..." : "Sign In with Google"}</span>
              </Button>

              <Link href="/" className="block">
                <Button variant="secondary" size="md" className="w-full justify-center text-xs">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format real timestamps from Firebase User Metadata
  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently joined";

  const lastActive = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active now";

  return (
    <div className="min-h-screen bg-brand-warm text-brand-dark flex flex-col selection:bg-brand-pink/15 selection:text-brand-pink">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-warm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark bg-brand-warm-subtle hover:bg-brand-warm-border px-3 py-1.5 rounded-full border border-brand-warm-border transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-24">
                <Image src="/brand/logo.png" alt="Suprilo" fill priority className="object-contain" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/create">
              <Button variant="primary" size="sm" className="gap-1.5 shadow-sm text-xs">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create a Card</span>
              </Button>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Profile Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card relative overflow-hidden">
          <div
            className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-gradient-to-br from-brand-pink/15 via-brand-orange/10 to-brand-purple/15 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <UserAvatar user={user} size="xl" className="ring-4 ring-brand-pink/20 shadow-md" />

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                  {user.displayName || "Suprilo Creator"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Account</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-brand-muted truncate max-w-md">
                {user.email || "No public email available"}
              </p>

              <p className="text-xs text-brand-dark/70 font-medium">
                Welcome back! Ready to craft your next unforgettable surprise moment.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-brand-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Member since {memberSince}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-purple" />
                  <span>Last active: {lastActive}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards Grid (7 Sections) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: My Cards */}
          <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-pink-light flex items-center justify-center text-brand-pink">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-brand-dark text-base">My Cards</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-warm-subtle text-brand-muted border border-brand-warm-border">
                  <Lock className="w-3 h-3" />
                  <span>Coming Soon</span>
                </span>
              </div>

              <p className="text-xs text-brand-muted leading-relaxed">
                Your published cards and shareable links will appear here once cloud persistence is activated in upcoming Phase 2B.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/create" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-center gap-1.5 text-xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Open Studio to Create</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Total Cards Created */}
          <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-orange-light flex items-center justify-center text-brand-orange">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-brand-dark text-base">Total Cards Created</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-warm-subtle text-brand-muted border border-brand-warm-border">
                  <Lock className="w-3 h-3" />
                  <span>Coming Soon</span>
                </span>
              </div>

              <div className="py-2">
                <div className="text-3xl font-extrabold text-brand-dark/40">—</div>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Analytics tracking will display your lifetime card creations once database storage connects.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-brand-muted/70 border-t border-brand-warm-border/50 pt-2">
              Zero fabricated data • Awaiting Phase 2B database
            </div>
          </div>

          {/* Card 3: Total Reveals */}
          <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-purple-light flex items-center justify-center text-brand-purple">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-brand-dark text-base">Total Reveals</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-warm-subtle text-brand-muted border border-brand-warm-border">
                  <Lock className="w-3 h-3" />
                  <span>Coming Soon</span>
                </span>
              </div>

              <div className="py-2">
                <div className="text-3xl font-extrabold text-brand-dark/40">—</div>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Recipient scratch-off reveal statistics will update live when someone uncovers your shared link.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-brand-muted/70 border-t border-brand-warm-border/50 pt-2">
              Real-time reveal counter coming in Phase 2B
            </div>
          </div>

          {/* Card 4: Templates & Cover Finishes */}
          <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-pink-light flex items-center justify-center text-brand-pink">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-brand-dark text-base">Templates & Styles</h3>
                </div>
                <span className="text-[10px] font-bold text-brand-pink bg-brand-pink-light px-2 py-0.5 rounded-full">
                  4 Active
                </span>
              </div>

              <p className="text-xs text-brand-muted leading-relaxed">
                4 signature metallic foil styles are unlocked and ready in your Card Studio.
              </p>

              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="h-6 rounded-lg bg-gradient-to-r from-[#FED7AA] via-[#FF4D6D] to-[#C084FC]" title="Lavender Pink" />
                <div className="h-6 rounded-lg bg-gradient-to-r from-[#FDE68A] via-[#F59E0B] to-[#D97706]" title="Golden Foil" />
                <div className="h-6 rounded-lg bg-gradient-to-r from-[#DDD6FE] via-[#8B5CF6] to-[#6D28D9]" title="Cosmic Purple" />
                <div className="h-6 rounded-lg bg-gradient-to-r from-[#A7F3D0] via-[#10B981] to-[#059669]" title="Mint Emerald" />
              </div>
            </div>

            <Link href="/create" className="block pt-2">
              <Button variant="secondary" size="sm" className="w-full justify-center gap-1.5 text-xs">
                <span>Customize in Studio</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {/* Card 5: Recent Activity */}
          <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-orange-light flex items-center justify-center text-brand-orange">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-brand-dark text-base">Recent Activity</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-warm-subtle text-brand-muted border border-brand-warm-border">
                  Live Log
                </span>
              </div>

              <ul className="text-xs space-y-2 text-brand-dark/80">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-dark">Signed in with Google</p>
                    <p className="text-[10px] text-brand-muted">{lastActive}</p>
                  </div>
                </li>
                <li className="flex items-start gap-2 text-brand-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-warm-border mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">Card interactions log</p>
                    <p className="text-[10px]">Arriving with cloud sharing in Phase 2B</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="text-[11px] text-brand-muted/70 border-t border-brand-warm-border/50 pt-2">
              Directly powered by Firebase Auth
            </div>
          </div>

          {/* Card 6: Saved Designs */}
          <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-purple-light flex items-center justify-center text-brand-purple">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-brand-dark text-base">Saved Designs</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-warm-subtle text-brand-muted border border-brand-warm-border">
                  <Lock className="w-3 h-3" />
                  <span>Coming Soon</span>
                </span>
              </div>

              <p className="text-xs text-brand-muted leading-relaxed">
                Save draft templates and revisit your favorite surprise card designs anytime.
              </p>
            </div>

            <div className="text-[11px] text-brand-muted/70 border-t border-brand-warm-border/50 pt-2">
              Draft persistence coming in Phase 2B
            </div>
          </div>
        </div>

        {/* Section 7: Account Settings & Security Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-brand-warm-border/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-brand-dark">Account Settings & Connection</h2>
              <p className="text-xs text-brand-muted">Verified authentication credentials via Firebase</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Session</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-brand-warm-subtle/70 border border-brand-warm-border space-y-1">
              <span className="text-[11px] text-brand-muted uppercase font-bold tracking-wider">Identity Provider</span>
              <p className="font-bold text-brand-dark flex items-center gap-1.5">
                <GoogleIcon className="w-3.5 h-3.5" />
                <span>Google (OAuth 2.0)</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-warm-subtle/70 border border-brand-warm-border space-y-1">
              <span className="text-[11px] text-brand-muted uppercase font-bold tracking-wider">Email Verified</span>
              <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{user.emailVerified ? "Verified by Google" : "Pending"}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-warm-subtle/70 border border-brand-warm-border space-y-1">
              <span className="text-[11px] text-brand-muted uppercase font-bold tracking-wider">User ID (UID)</span>
              <p className="font-mono text-brand-dark truncate" title={user.uid}>
                {user.uid.slice(0, 14)}...
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-warm-subtle/70 border border-brand-warm-border space-y-1">
              <span className="text-[11px] text-brand-muted uppercase font-bold tracking-wider">Auth Persistence</span>
              <p className="font-bold text-brand-dark">Local Secure Storage</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-brand-muted">
              Need to switch accounts or take a break? You can safely sign out of your Suprilo session.
            </p>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 px-4 py-2 rounded-xl border border-rose-200 hover:border-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Suprilo</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
