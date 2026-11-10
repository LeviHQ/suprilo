"use client";

import * as React from "react";
import {
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Save,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { CreatorProfile } from "@/types/profile";

interface ProfileIdentityCardProps {
  profile: CreatorProfile | null;
  onProfileUpdated: (updated: CreatorProfile) => void;
}

export function ProfileIdentityCard({ profile, onProfileUpdated }: ProfileIdentityCardProps) {
  const { user, setOptimisticProfile } = useAuth();

  const [displayName, setDisplayName] = React.useState(profile?.display_name || user?.displayName || "");
  const [bio, setBio] = React.useState(profile?.bio || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Sync with prop when fetched
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio || "");
    }
  }, [profile]);

  const hasChanges =
    displayName.trim() !== (profile?.display_name || user?.displayName || "") ||
    bio.trim() !== (profile?.bio || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanBio = bio.trim();

    if (!cleanName) {
      setErrorMessage("Display name cannot be empty.");
      return;
    }

    if (cleanName.length > 50) {
      setErrorMessage("Display name cannot exceed 50 characters.");
      return;
    }

    if (cleanBio.length > 100) {
      setErrorMessage("Bio cannot exceed 100 characters.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Optimistic UI update across app (Sidebar, Header, Profile)
    setOptimisticProfile({ displayName: cleanName });

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          display_name: cleanName,
          bio: cleanBio || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update profile identity.");
      }

      onProfileUpdated(data.profile);
      setSuccessMessage("Creator identity updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error saving profile identity";
      setErrorMessage(msg);
      // Revert optimistic update
      setOptimisticProfile({ displayName: profile?.display_name || user?.displayName || "" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="profile-identity"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6"
    >
      {/* Header */}
      <div className="border-b border-brand-warm-border/60 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-brand-dark tracking-tight">Creator Identity</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Public Info
          </span>
        </div>
        <p className="text-xs text-brand-muted">
          Your public display name and creator bio visible across cards, scratch animations, and showcases.
        </p>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 max-w-xl">
        {/* Display Name Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="displayName" className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
              Display Name
            </label>
            <span className="text-[11px] text-brand-muted">{displayName.length}/50</span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
              <User className="w-4 h-4" />
            </div>
            <input
              id="displayName"
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Adarsh Mishra"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-warm-border bg-white text-brand-dark text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all"
            />
          </div>
          <p className="text-[11px] text-brand-muted">
            The name friends and recipients see when scratching your cards.
          </p>
        </div>

        {/* Creator Bio Input with Live Character Counter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="bio" className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
              Creator Bio / Headline
            </label>
            <span
              className={`text-[11px] font-medium ${
                bio.length > 90 ? "text-amber-600 font-bold" : "text-brand-muted"
              }`}
            >
              {bio.length}/100
            </span>
          </div>

          <div className="relative">
            <div className="absolute top-3 left-3.5 pointer-events-none text-brand-muted">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              id="bio"
              rows={3}
              maxLength={100}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Crafting magical scratch moments for friends & family..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-warm-border bg-white text-brand-dark text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all resize-none"
            />
          </div>
          <p className="text-[11px] text-brand-muted">
            A short phrase describing your craft or greeting your recipients (up to 100 characters).
          </p>
        </div>

        {/* Associated Account Email (Read-only) */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
            Connected Google Email
          </label>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm/30 text-brand-muted text-sm select-none">
            <Mail className="w-4 h-4 text-brand-muted shrink-0" />
            <span className="truncate">{user?.email}</span>
            <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-brand-muted">
            Primary email authenticated via Google OAuth 2.0.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSaving || !hasChanges}
            className="gap-2 text-xs shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Identity...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

