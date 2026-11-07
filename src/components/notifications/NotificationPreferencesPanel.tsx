"use client";

import * as React from "react";
import {
  Bell,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Award,
  TrendingUp,
  Shield,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NotificationPreferences {
  in_app_enabled: boolean;
  push_enabled: boolean;
  notify_on_reveal: boolean;
  notify_on_badge: boolean;
  notify_on_level: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  in_app_enabled: true,
  push_enabled: false,
  notify_on_reveal: true,
  notify_on_badge: true,
  notify_on_level: true,
};

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = React.useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [pushStatusLoading, setPushStatusLoading] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Browser Push State
  const [browserPermission, setBrowserPermission] = React.useState<NotificationPermission | "unsupported">("default");
  const [isDeviceSubscribed, setIsDeviceSubscribed] = React.useState<boolean>(false);
  const [pushConfiguredOnServer, setPushConfiguredOnServer] = React.useState<boolean>(false);
  const [serverVapidKey, setServerVapidKey] = React.useState<string | null>(null);

  // Check initial browser capability and permission
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setBrowserPermission("unsupported");
      } else {
        setBrowserPermission(Notification.permission);
      }
    }
  }, []);

  // Fetch user preferences and push status
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch preferences
      const prefRes = await fetch("/api/notification-preferences", { credentials: "same-origin" });
      if (prefRes.ok) {
        const prefJson = await prefRes.json();
        if (prefJson?.data) {
          setPrefs({
            in_app_enabled: prefJson.data.in_app_enabled ?? true,
            push_enabled: prefJson.data.push_enabled ?? false,
            notify_on_reveal: prefJson.data.notify_on_reveal ?? true,
            notify_on_badge: prefJson.data.notify_on_badge ?? true,
            notify_on_level: prefJson.data.notify_on_level ?? true,
          });
        }
      }

      // 2. Fetch server VAPID push status
      const pushRes = await fetch("/api/push/status", { credentials: "same-origin" });
      if (pushRes.ok) {
        const pushJson = await pushRes.json();
        setPushConfiguredOnServer(Boolean(pushJson.configured && pushJson.public_key));
        setServerVapidKey(pushJson.public_key || null);
      }

      // 3. Check if current device has an active push subscription
      if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
        try {
          const reg = await navigator.serviceWorker.getRegistration("/sw.js");
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            setIsDeviceSubscribed(Boolean(sub));
          }
        } catch {
          // SW not active yet
        }
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to load notification settings." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle in-app preference fields
  const handleToggle = async (key: keyof Omit<NotificationPreferences, "push_enabled">) => {
    const updatedValue = !prefs[key];
    const prevPrefs = { ...prefs };

    // Optimistic update
    setPrefs((prev) => ({ ...prev, [key]: updatedValue }));
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ [key]: updatedValue }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.message || "Failed to update preference.");
      }

      setFeedback({ type: "success", message: "Notification preferences saved." });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setPrefs(prevPrefs);
      const msg = err instanceof Error ? err.message : "Update failed.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Browser Push Subscription Flow (Triggered strictly by explicit user click)
  const handleEnablePush = async () => {
    if (browserPermission === "unsupported") {
      setFeedback({ type: "error", message: "Push notifications are not supported by this browser." });
      return;
    }

    if (!pushConfiguredOnServer || !serverVapidKey) {
      setFeedback({
        type: "error",
        message: "Push notifications are currently unavailable in this environment (server VAPID keys not configured).",
      });
      return;
    }

    setPushStatusLoading(true);
    setFeedback(null);

    try {
      // 1. Explicit permission request
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);

      if (permission !== "granted") {
        setFeedback({
          type: "error",
          message: "Notification permission was not granted. Please enable notifications in your browser settings.",
        });
        return;
      }

      // 2. Register Service Worker
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // 3. Subscribe to PushManager
      const appServerKey = urlBase64ToUint8Array(serverVapidKey);
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      }

      const rawSub = sub.toJSON();
      if (!rawSub.endpoint || !rawSub.keys?.p256dh || !rawSub.keys?.auth) {
        throw new Error("Browser generated an incomplete push subscription.");
      }

      // 4. Persist subscription on server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          endpoint: rawSub.endpoint,
          keys: {
            p256dh: rawSub.keys.p256dh,
            auth: rawSub.keys.auth,
          },
          user_agent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson?.message || "Failed to register subscription on server.");
      }

      setIsDeviceSubscribed(true);
      setPrefs((prev) => ({ ...prev, push_enabled: true }));
      setFeedback({ type: "success", message: "Push notifications enabled for this device!" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not enable push notifications.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setPushStatusLoading(false);
    }
  };

  // Browser Push Unsubscribe Flow
  const handleDisablePush = async () => {
    setPushStatusLoading(true);
    setFeedback(null);

    try {
      let endpoint: string | null = null;

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            endpoint = sub.endpoint;
            await sub.unsubscribe();
          }
        }
      }

      // Notify server
      const res = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ endpoint: endpoint || undefined }),
      });

      if (!res.ok) {
        throw new Error("Failed to update push preference on server.");
      }

      const json = await res.json();
      setIsDeviceSubscribed(false);
      setPrefs((prev) => ({ ...prev, push_enabled: Boolean(json.data?.push_enabled) }));
      setFeedback({ type: "success", message: "Push notifications disabled on this device." });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disable push notifications.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setPushStatusLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3 bg-white rounded-2xl border border-brand-warm-border">
        <Loader2 className="w-8 h-8 animate-spin text-brand-pink mx-auto" />
        <p className="text-xs font-semibold text-brand-dark">Loading notification preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Browser Push Notifications Section */}
      <div className="bg-white rounded-2xl border border-brand-warm-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-pink-light flex items-center justify-center text-brand-pink">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-brand-dark">Browser Push Notifications</h3>
            </div>
            <p className="text-xs text-brand-muted leading-relaxed max-w-xl">
              Receive immediate alerts in your browser when someone scratches your card or when you unlock badges, even when Suprilo isn&apos;t open.
            </p>
          </div>

          <div className="shrink-0">
            {isDeviceSubscribed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active on this device
              </span>
            ) : browserPermission === "denied" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Blocked in browser
              </span>
            ) : browserPermission === "unsupported" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                Unsupported
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-warm-subtle text-brand-muted border border-brand-warm-border">
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Action Controls for Push */}
        <div className="pt-2 border-t border-brand-warm-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-brand-muted flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-pink" />
            <span>Encrypted WebPush • Zero tracking • One-click revoke</span>
          </div>

          <div>
            {isDeviceSubscribed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisablePush}
                disabled={pushStatusLoading}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
              >
                {pushStatusLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Disable on this device
              </Button>
            ) : browserPermission === "denied" ? (
              <p className="text-xs font-medium text-rose-600">
                Notifications blocked. Please click the lock icon in your URL bar to allow notifications for Suprilo.
              </p>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnablePush}
                disabled={pushStatusLoading || browserPermission === "unsupported"}
                className="text-xs gap-1.5"
              >
                {pushStatusLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Enable Push Notifications</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. In-App Notification Categories Section */}
      <div className="bg-white rounded-2xl border border-brand-warm-border p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between gap-4 border-b border-brand-warm-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-warm-subtle flex items-center justify-center text-brand-dark">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-dark">In-App Notifications</h3>
              <p className="text-xs text-brand-muted">Control which activity triggers notification bell updates.</p>
            </div>
          </div>

          {/* Master In-App Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={prefs.in_app_enabled}
            disabled={isSaving}
            onClick={() => handleToggle("in_app_enabled")}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink disabled:opacity-50 ${
              prefs.in_app_enabled ? "bg-brand-pink" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                prefs.in_app_enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Category Specific Toggles */}
        <div className={`space-y-4 transition-opacity ${!prefs.in_app_enabled ? "opacity-40 pointer-events-none" : ""}`}>
          {/* Card Reveal */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-brand-pink mt-0.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-dark">Card Reveal Alerts</p>
                <p className="text-[11px] text-brand-muted">Notify me whenever a recipient scratches and reveals one of my cards.</p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={prefs.notify_on_reveal}
              disabled={isSaving || !prefs.in_app_enabled}
              onClick={() => handleToggle("notify_on_reveal")}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink disabled:opacity-50 ${
                prefs.notify_on_reveal ? "bg-brand-pink" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  prefs.notify_on_reveal ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Badge Unlocked */}
          <div className="flex items-center justify-between gap-4 py-1 border-t border-brand-warm-border/40 pt-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-brand-orange mt-0.5 shrink-0">
                <Award className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-dark">Badge Achievements</p>
                <p className="text-[11px] text-brand-muted">Notify me when I earn milestone badges and achievement tokens.</p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={prefs.notify_on_badge}
              disabled={isSaving || !prefs.in_app_enabled}
              onClick={() => handleToggle("notify_on_badge")}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink disabled:opacity-50 ${
                prefs.notify_on_badge ? "bg-brand-pink" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  prefs.notify_on_badge ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Level Up */}
          <div className="flex items-center justify-between gap-4 py-1 border-t border-brand-warm-border/40 pt-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mt-0.5 shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-dark">Level Progression</p>
                <p className="text-[11px] text-brand-muted">Notify me when my gamification XP advances to a new creator level.</p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={prefs.notify_on_level}
              disabled={isSaving || !prefs.in_app_enabled}
              onClick={() => handleToggle("notify_on_level")}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink disabled:opacity-50 ${
                prefs.notify_on_level ? "bg-brand-pink" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  prefs.notify_on_level ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 rounded-xl bg-brand-warm-subtle/50 border border-brand-warm-border/60 flex items-center gap-2.5 text-[11px] text-brand-muted">
        <Info className="w-4 h-4 text-brand-pink shrink-0" />
        <span>
          Suppressed notifications are recorded intentionally and will not be resurrected during automated reconciliation.
        </span>
      </div>
    </div>
  );
}

