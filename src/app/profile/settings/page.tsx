"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import {
  Mail,
  ShieldCheck,
  Lock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Bell,
  Trash2,
  Camera,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  // Name editing state
  const [displayName, setDisplayName] = React.useState(user?.displayName || "");
  const [isUpdatingName, setIsUpdatingName] = React.useState(false);
  const [nameSuccess, setNameSuccess] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);

  // Danger zone deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  if (!user) return null;

  // Real update via Firebase Auth updateProfile
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setNameError("Display name cannot be empty.");
      return;
    }

    setIsUpdatingName(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
      });
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 4000);
    } catch {
      setNameError("Failed to update profile name. Please try again.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Account Settings"
        description="Manage your Suprilo creator identity, review security sessions, and configure profile preferences."
        badge="Account Center"
        badgeVariant="neutral"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Account Settings" },
        ]}
      />

      {/* Group A: Profile Information */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6">
        <div className="border-b border-brand-warm-border/60 pb-4">
          <h3 className="text-lg font-bold text-brand-dark tracking-tight">Profile Information</h3>
          <p className="text-xs text-brand-muted">Your public creator identity visible to recipients</p>
        </div>

        {/* Avatar & Photo Upload Coming Soon */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-brand-warm-border/60">
          <div className="relative group">
            <UserAvatar user={user} size="xl" className="ring-4 ring-brand-warm-border" />
            <div
              className="absolute inset-0 bg-brand-dark/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed"
              title="Photo upload storage coming soon"
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h4 className="text-sm font-bold text-brand-dark">Profile Photo</h4>
            <p className="text-xs text-brand-muted max-w-md leading-relaxed">
              Synced automatically from your Google account. Custom photo uploads will be supported once storage attachments launch in Phase 4.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                <Lock className="w-3 h-3" />
                <span>Custom Avatar Upload (Coming Soon)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Display Name Edit Form */}
        <form onSubmit={handleUpdateName} className="space-y-4 max-w-lg">
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-brand-warm-border bg-white text-brand-dark text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all"
                placeholder="Enter your creator name"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isUpdatingName || displayName === user.displayName}
                className="shrink-0 text-xs"
              >
                {isUpdatingName ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {nameSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Display name successfully updated in Firebase!</span>
            </div>
          )}

          {nameError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{nameError}</span>
            </div>
          )}

          {/* Email Address (Read-only) */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm/30 text-brand-muted text-sm select-none">
              <Mail className="w-4 h-4 text-brand-muted shrink-0" />
              <span className="truncate">{user.email}</span>
              <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-brand-muted">
              Primary email associated with your Google Account authentication.
            </p>
          </div>
        </form>
      </div>

      {/* Group B: Profile Visibility */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-brand-dark tracking-tight">Profile Visibility</h3>
              <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-brand-muted">Choose whether your creator profile and badges are public</p>
          </div>

          <Eye className="w-5 h-5 text-brand-muted" />
        </div>

        <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2 text-xs text-brand-dark/80">
          <p className="leading-relaxed">
            Public creator showcase URLs (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-brand-warm-border font-mono text-[11px]">suprilo.com/@{user.displayName?.toLowerCase().replace(/\s+/g, "") || "creator"}</code>) will be available in a future update with server-side authorization controls.
          </p>
          <div className="flex items-center gap-2 pt-1 text-brand-muted">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Currently, all creator accounts are private by default.</span>
          </div>
        </div>
      </div>

      {/* Group C: Preferences */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-brand-dark tracking-tight">Notification Preferences</h3>
              <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-brand-muted">Manage email alerts and instant reveal notifications</p>
          </div>

          <Bell className="w-5 h-5 text-brand-muted" />
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-brand-warm-border/60 bg-brand-warm/20 opacity-70 cursor-not-allowed">
            <input type="checkbox" disabled defaultChecked className="mt-0.5 rounded text-brand-pink" />
            <div className="text-xs">
              <strong className="text-brand-dark">Scratch Reveal Instant Alerts</strong>
              <p className="text-brand-muted">Get an email notification the moment a recipient reveals your surprise card.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-brand-warm-border/60 bg-brand-warm/20 opacity-70 cursor-not-allowed">
            <input type="checkbox" disabled className="mt-0.5 rounded text-brand-pink" />
            <div className="text-xs">
              <strong className="text-brand-dark">Weekly Creator Digest</strong>
              <p className="text-brand-muted">Receive a weekly summary of card views, love notes, and badge progress.</p>
            </div>
          </label>
        </div>
      </div>

      {/* Group D: Security and Sessions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6">
        <div className="border-b border-brand-warm-border/60 pb-4">
          <h3 className="text-lg font-bold text-brand-dark tracking-tight">Security & Active Session</h3>
          <p className="text-xs text-brand-muted">Manage your authenticated session and login providers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-1">
            <span className="text-brand-muted font-medium">Authentication Provider</span>
            <div className="flex items-center gap-1.5 font-bold text-brand-dark pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Google OAuth 2.0</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-1">
            <span className="text-brand-muted font-medium">Session Persistence</span>
            <div className="flex items-center gap-1.5 font-bold text-brand-dark pt-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Firebase Managed (Secure)</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-brand-warm-border/60">
          <div>
            <h4 className="text-sm font-bold text-brand-dark">Sign Out of Session</h4>
            <p className="text-xs text-brand-muted">Securely terminate your current session on this device</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSignOut}
            className="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 gap-1.5 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Group E: Danger Zone — Delete Account */}
      <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-900 tracking-tight">Danger Zone</h3>
            <p className="text-xs text-rose-700/80">Irreversible account actions and data removal</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-rose-200">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-brand-dark">Delete Suprilo Account</h4>
            <p className="text-xs text-brand-muted max-w-md">
              Permanently delete your creator account, surprise card records, and associated achievements.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-rose-600 border-rose-300 hover:bg-rose-50 shrink-0 text-xs gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </Button>
        </div>
      </div>

      {/* Danger Zone Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-warm-border space-y-5 z-10 animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-warm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-brand-dark">Account Deletion Workflow</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Permanent account deletion is destructive and cannot be undone. To prevent accidental data loss or orphaned surprise cards, a comprehensive server-side deletion engine is being deployed in a future release.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Feature Notice (Coming Soon)</span>
              </div>
              <p className="leading-relaxed">
                Direct automated deletion is not available in Phase 3. If you require immediate account removal, please submit a request through Support Tickets.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full justify-center text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
