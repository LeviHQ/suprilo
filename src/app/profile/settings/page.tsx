"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CreatorProfile } from "@/types/profile";
import { CreatorMetaOverviewCard } from "@/components/settings/CreatorMetaOverviewCard";
import { ProfileIdentityCard } from "@/components/settings/ProfileIdentityCard";
import { UsernameReservationCard } from "@/components/settings/UsernameReservationCard";
import { AvatarStudioCard } from "@/components/settings/AvatarStudioCard";
import { SecuritySessionCard } from "@/components/settings/SecuritySessionCard";
import { DataPrivacyCard } from "@/components/settings/DataPrivacyCard";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { Loader2 } from "lucide-react";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<CreatorProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState<boolean>(true);

  // Fetch Authoritative Creator Profile from /api/user/profile
  React.useEffect(() => {
    let isMounted = true;
    if (!user) return;

    setIsLoadingProfile(true);
    fetch("/api/user/profile", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (isMounted && data?.success && data?.profile) {
          setProfile(data.profile);
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[AccountSettingsPage] Error fetching profile:", err);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Smooth scroll to anchor target if URL hash is present (e.g. from notification redirection)
  React.useEffect(() => {
    if (isLoadingProfile) return;

    const hash = window.location.hash;
    if (hash) {
      const elementId = hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          // Highlight flash animation
          el.classList.add("ring-2", "ring-brand-pink", "ring-offset-4");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-brand-pink", "ring-offset-4");
          }, 2500);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoadingProfile]);

  const handleProfileUpdated = React.useCallback((updated: CreatorProfile) => {
    setProfile(updated);
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Account Settings"
        description="Manage your Suprilo creator identity, handle reservations, custom avatars, and data privacy."
        badge="Account Center"
        badgeVariant="neutral"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Account Settings" },
        ]}
      />

      {isLoadingProfile ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-brand-warm-border shadow-card space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-pink mx-auto" />
          <p className="text-xs text-brand-muted font-medium">Loading creator account data...</p>
        </div>
      ) : (
        <>
          {/* 2. Creator Meta & Overview (Section B: Preserved ID, Level, XP, Tier, Member Since) */}
          <CreatorMetaOverviewCard />

          {/* 3. Creator Profile & Identity (Section A1, A3: Display Name & Bio with 100-char counter) */}
          <ProfileIdentityCard
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />

          {/* 4. Creator Handle Reservation (Section A2: @handle, 30-day throttle lock, availability check) */}
          <UsernameReservationCard
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />

          {/* 5. Avatar Studio (Section A4: Google photo vs 10 presets vs 1MB custom crop upload) */}
          <AvatarStudioCard
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />

          {/* 6. Security, Device & Active Session (Section C: Current OS, browser, Google auth provider, sign out) */}
          <SecuritySessionCard />

          {/* 7. Data & Privacy Center (Section D: Export creator data JSON, Card analytics toggle) */}
          <DataPrivacyCard
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />

          {/* 8. Danger Zone (Section E: Dual-input permanent deletion workflow) */}
          <DangerZoneCard
            expectedDisplayName={profile?.display_name || user.displayName || "Creator"}
          />
        </>
      )}
    </div>
  );
}
