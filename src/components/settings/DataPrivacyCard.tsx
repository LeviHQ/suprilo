"use client";

import * as React from "react";
import {
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileJson,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CreatorProfile } from "@/types/profile";

interface DataPrivacyCardProps {
  profile: CreatorProfile | null;
  onProfileUpdated: (updated: CreatorProfile) => void;
}

export function DataPrivacyCard({ profile, onProfileUpdated }: DataPrivacyCardProps) {
  const [allowAnalytics, setAllowAnalytics] = React.useState<boolean>(
    profile?.allow_card_analytics ?? true
  );

  const [isExporting, setIsExporting] = React.useState(false);
  const [isTogglingPrivacy, setIsTogglingPrivacy] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile) {
      setAllowAnalytics(profile.allow_card_analytics);
    }
  }, [profile]);

  // Handle Export Data Download
  const handleExportData = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/user/export-data", {
        credentials: "same-origin",
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || "Failed to download creator archive.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;

      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `suprilo-creator-data-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage("Creator data archive downloaded successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error exporting creator data";
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Card Analytics Toggle
  const handleToggleAnalytics = async () => {
    const nextState = !allowAnalytics;
    setIsTogglingPrivacy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Optimistic local state update
    setAllowAnalytics(nextState);

    try {
      const res = await fetch("/api/user/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ allow_card_analytics: nextState }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update card privacy preference.");
      }

      if (profile) {
        onProfileUpdated({ ...profile, allow_card_analytics: nextState });
      }

      setSuccessMessage(
        nextState
          ? "Card telemetry collection is now enabled."
          : "Card telemetry collection is now disabled. Views and reveals will not be logged."
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      // Revert optimistic update
      setAllowAnalytics(!nextState);
      const msg = err instanceof Error ? err.message : "Error updating privacy setting";
      setErrorMessage(msg);
    } finally {
      setIsTogglingPrivacy(false);
    }
  };

  return (
    <div
      id="data-privacy"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-warm-border/60 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-brand-dark tracking-tight inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>Data & Privacy Center</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap shrink-0">
              Control
            </span>
          </h3>
          <p className="text-xs text-brand-muted mt-1">
            Manage your card telemetry privacy preferences and export an authoritative backup of your creator records.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-brand-muted bg-brand-warm-subtle px-3 py-1 rounded-full border border-brand-warm-border self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5 text-brand-pink" />
          <span>GDPR & Privacy Compliant</span>
        </div>
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

      {/* Section 1: Card Analytics Privacy Toggle */}
      <div className="p-5 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-brand-dark">
                Allow Card View & Reveal Analytics Collection
              </h4>
              {allowAnalytics ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Paused
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted max-w-xl leading-relaxed">
              When enabled, incoming recipient views and scratch reveals are recorded in your card metrics. When disabled, telemetry logging is skipped while recipient scratch animations remain completely uninterrupted.
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={allowAnalytics}
            onClick={handleToggleAnalytics}
            disabled={isTogglingPrivacy}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-2 ${
              allowAnalytics ? "bg-brand-pink" : "bg-neutral-300"
            } disabled:opacity-50`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                allowAnalytics ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="pt-2 border-t border-brand-warm-border/60 flex items-center gap-2 text-[11px] text-brand-muted">
          {allowAnalytics ? (
            <>
              <Eye className="w-3.5 h-3.5 text-brand-pink shrink-0" />
              <span>Card engagement is actively counted in your Studio metrics and badges.</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Telemetry recording is stopped. Existing counts remain preserved.</span>
            </>
          )}
        </div>
      </div>

      {/* Section 2: Export Creator Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-brand-warm-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-brand-orange" />
            <h4 className="text-sm font-bold text-brand-dark">Export Creator Data</h4>
          </div>
          <p className="text-xs text-brand-muted max-w-lg leading-relaxed">
            Download a structured JSON archive containing your created surprise cards, metrics, earned badges, gamification stats, and preferences.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleExportData}
          disabled={isExporting}
          className="gap-2 text-xs shrink-0 self-start sm:self-auto shadow-xs"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Backup...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Archive</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

