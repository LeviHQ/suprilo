"use client";

import * as React from "react";
import {
  AtSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  CreatorProfile,
  validateUsername,
  getUsernameEligibility,
} from "@/types/profile";

interface UsernameReservationCardProps {
  profile: CreatorProfile | null;
  onProfileUpdated: (updated: CreatorProfile) => void;
}

export function UsernameReservationCard({
  profile,
  onProfileUpdated,
}: UsernameReservationCardProps) {
  const currentUsername = profile?.username || "";
  const [handleInput, setHandleInput] = React.useState("");

  // Keep input empty on profile updates so user can type a new handle directly
  React.useEffect(() => {
    setHandleInput("");
  }, [profile?.username]);

  // Real-time availability check state
  const [isChecking, setIsChecking] = React.useState(false);
  const [availabilityResult, setAvailabilityResult] = React.useState<{
    checked: boolean;
    available: boolean;
    isTaken?: boolean;
    isReserved?: boolean;
    reason?: string;
  }>({ checked: false, available: true, isTaken: false, isReserved: false });

  // Confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Feedback alerts
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // 30-day throttle calculation
  const eligibility = React.useMemo(
    () => getUsernameEligibility(profile?.username_updated_at || null),
    [profile?.username_updated_at]
  );

  const cleanHandle = handleInput.trim().toLowerCase();
  const isChanged = Boolean(cleanHandle && cleanHandle !== currentUsername.toLowerCase());

  // When locked under 30-day throttle, display registered username in disabled read-only format
  // When eligible to change, display handleInput (starts blank with placeholder="e.g. bob")
  const displayedValue = eligibility.canChange ? handleInput : currentUsername;

  // Debounced real-time availability check against /api/user/check-username
  React.useEffect(() => {
    if (!isChanged) {
      setAvailabilityResult({ checked: false, available: true, isTaken: false, isReserved: false });
      setIsChecking(false);
      return;
    }

    // Client-side quick syntax validation first
    const clientValidation = validateUsername(cleanHandle);
    if (!clientValidation.valid) {
      const isReserved = clientValidation.error?.includes("reserved by the platform") || false;
      setAvailabilityResult({
        checked: true,
        available: false,
        isTaken: false,
        isReserved,
        reason: clientValidation.error,
      });
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/check-username?username=${encodeURIComponent(cleanHandle)}`,
          { credentials: "same-origin" }
        );
        const data = await res.json();
        setAvailabilityResult({
          checked: true,
          available: Boolean(data.available),
          isTaken: Boolean(data.isTaken),
          isReserved: Boolean(data.isReserved),
          reason: data.reason,
        });
      } catch {
        setAvailabilityResult({
          checked: true,
          available: false,
          isTaken: false,
          isReserved: false,
          reason: "Error checking handle availability.",
        });
      } finally {
        setIsChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [cleanHandle, isChanged]);

  // Handle Form Submit -> opens confirmation modal
  const handleInitiateChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility.canChange) {
      setErrorMessage(`Handle changes are locked. You can change again after ${eligibility.formattedDate}.`);
      return;
    }

    const validation = validateUsername(cleanHandle);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid username format.");
      return;
    }

    if (!availabilityResult.available) {
      setErrorMessage(availabilityResult.reason || "This username is not available.");
      return;
    }

    setErrorMessage(null);
    setIsConfirmModalOpen(true);
  };

  // Perform authoritative reservation via POST /api/user/update-username
  const handleConfirmReservation = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/user/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: cleanHandle }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to reserve handle.");
      }

      onProfileUpdated(data.profile);
      setHandleInput("");
      setAvailabilityResult({ checked: false, available: true, isTaken: false });
      setIsConfirmModalOpen(false);
      setSuccessMessage(`@${data.profile.username} is now reserved for your creator showcase!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error reserving handle";
      setErrorMessage(msg);
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="creator-handle"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-warm-border/60 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-brand-dark tracking-normal inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>Creator Handle Reservation</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 whitespace-nowrap shrink-0">
              Unique Handle
            </span>
          </h3>
          <p className="text-xs text-brand-muted mt-1">
            Reserve your unique @handle for your upcoming public creator showcase.
          </p>
        </div>

        {/* 30-Day Throttle Status Badge */}
        {!eligibility.canChange ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Locked ({eligibility.daysRemaining}d remaining)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eligible to change</span>
          </span>
        )}
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

      {/* Lock Notice Banner if throttled */}
      {!eligibility.canChange && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Handle change cooldown active</span>
          </div>
          <p className="leading-relaxed text-amber-800/90 pl-6">
            Usernames can only be modified once every 30 days to maintain link stability and prevent impersonation. Your next change will become available on{" "}
            <strong>{eligibility.formattedDate}</strong>.
          </p>
        </div>
      )}

      {/* Handle Reservation Form */}
      <form onSubmit={handleInitiateChange} className="space-y-4 max-w-lg">
        <div className="space-y-1.5">
          <label
            htmlFor="usernameInput"
            className="block text-xs font-bold text-brand-dark uppercase tracking-wider"
          >
            Reserved Creator Handle
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
              <AtSign className="w-4 h-4" />
            </div>

            <input
              id="usernameInput"
              type="text"
              minLength={3}
              maxLength={20}
              value={displayedValue}
              disabled={!eligibility.canChange}
              readOnly={!eligibility.canChange}
              onChange={(e) => {
                if (!eligibility.canChange) return;
                // Strict input sanitization: allow only lowercase letters, digits, and underscores
                const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                setHandleInput(sanitized);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder={eligibility.canChange ? "e.g. bob" : undefined}
              className="w-full pl-9 pr-28 py-2.5 rounded-xl border border-brand-warm-border bg-white text-brand-dark text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-pink transition-all disabled:bg-brand-warm-subtle/80 disabled:text-brand-dark/80 disabled:cursor-not-allowed"
            />

            {/* Live Availability Badge inside input */}
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              {!eligibility.canChange ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Locked</span>
                </span>
              ) : isChecking ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-brand-muted bg-brand-warm px-2 py-1 rounded-lg">
                  <Loader2 className="w-3 h-3 animate-spin text-brand-pink" />
                  <span>Checking...</span>
                </span>
              ) : isChanged && availabilityResult.checked ? (
                availabilityResult.available ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Available</span>
                  </span>
                ) : availabilityResult.isReserved ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                    <AlertCircle className="w-3 h-3 text-purple-600" />
                    <span>Reserved</span>
                  </span>
                ) : availabilityResult.isTaken ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Taken</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Invalid</span>
                  </span>
                )
              ) : null}
            </div>
          </div>

          <p className="text-[11px] text-brand-muted">
            {!eligibility.canChange ? (
              <span className="text-amber-800/90 font-medium">
                Handle is locked until {eligibility.formattedDate}. Next modification will open after 30 days.
              </span>
            ) : (
              "3–20 characters. Alphanumeric characters and underscores only."
            )}
          </p>
        </div>

        {/* Validation Error Message */}
        {isChanged && availabilityResult.checked && !availabilityResult.available && (
          <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{availabilityResult.reason || "Username is not available."}</span>
          </p>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={
              !eligibility.canChange ||
              !isChanged ||
              isChecking ||
              !availabilityResult.available ||
              isSubmitting
            }
            className="text-xs gap-1.5 shadow-md"
          >
            <span>Reserve Handle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>

      {/* Future Showcase Roadmap Card */}
      <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-pink shrink-0" />
            <h4 className="text-xs font-bold text-brand-dark">Public Showcase URL (Coming Soon)</h4>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap shrink-0">
              Roadmap
            </span>
          </div>
        </div>

        <p className="text-xs text-brand-muted leading-relaxed">
          Your reserved handle will soon identify your public creator showcase at:
        </p>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-brand-warm-border text-xs font-mono text-brand-dark/90">
          <span className="text-brand-muted select-none">https://suprilo.com/@</span>
          <span className="font-bold text-brand-pink">{cleanHandle || "username"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-brand-muted pt-1">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>All creator accounts are currently private. Public routing is locked.</span>
        </div>
      </div>

      {/* 30-Day Confirmation Modal */}
      {isConfirmModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-username-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm"
            onClick={() => {
              if (!isSubmitting) setIsConfirmModalOpen(false);
            }}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-left space-y-5"
          >
            <div className="flex items-center justify-between border-b border-brand-warm-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <h3 id="confirm-username-title" className="text-base font-bold text-brand-dark">
                  Confirm Handle Reservation
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="p-1.5 text-brand-muted hover:text-brand-dark rounded-xl hover:bg-brand-warm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-brand-dark/80">
              <p>
                You are about to change your handle from{" "}
                <strong className="text-brand-dark font-mono">@{currentUsername}</strong> to{" "}
                <strong className="text-brand-pink font-mono text-sm">@{cleanHandle}</strong>.
              </p>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>30-Day Lock Commitment</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-normal">
                  Once confirmed, this handle will be permanently locked for the next 30 days. You will not be able to modify it again until after 30 days from now.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 justify-center text-xs"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmReservation}
                disabled={isSubmitting}
                className="flex-1 justify-center gap-2 text-xs shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Reserving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Lock</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

