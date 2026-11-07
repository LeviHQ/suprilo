"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Sparkles,
  Award,
  TrendingUp,
  Info,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useUnreadNotificationsCount } from "@/lib/client/unread-notifications";

export interface NotificationItem {
  id: string;
  type: "CARD_REVEAL" | "BADGE_UNLOCKED" | "LEVEL_UP" | "SYSTEM";
  title: string;
  body: string;
  event_dedup_key: string;
  metadata: Record<string, unknown>;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return "";
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getNotificationTypeIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "CARD_REVEAL":
      return <Sparkles className="w-4 h-4 text-brand-pink" />;
    case "BADGE_UNLOCKED":
      return <Award className="w-4 h-4 text-brand-orange" />;
    case "LEVEL_UP":
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    case "SYSTEM":
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

class BellErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("[NotificationBell] Caught exception inside boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function NotificationBellInner({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, setCount: setGlobalCount, refresh: refreshCount } = useUnreadNotificationsCount();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Fetch unread count from API (queries /api/notifications/unread-count via centralized deduplicated cache)
  const fetchUnreadCount = React.useCallback(async (force = false) => {
    if (!user) return;
    await refreshCount(force);
  }, [user, refreshCount]);

  // Fetch latest 3 notifications for dropdown
  const fetchLatestNotifications = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications?limit=3", { credentials: "same-origin" });
      if (!res.ok) {
        throw new Error("Failed to load notifications");
      }
      const json = await res.json();
      const items: NotificationItem[] = json?.data?.items || [];
      setNotifications(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading notifications";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const isOpenRef = React.useRef(isOpen);
  isOpenRef.current = isOpen;

  const fetchUnreadCountRef = React.useRef(fetchUnreadCount);
  fetchUnreadCountRef.current = fetchUnreadCount;

  const fetchLatestNotificationsRef = React.useRef(fetchLatestNotifications);
  fetchLatestNotificationsRef.current = fetchLatestNotifications;

  // Subscribe to Supabase Realtime for instant updates & unread count synchronization
  React.useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      setGlobalCount(0);
      setNotifications([]);
      return;
    }

    fetchUnreadCountRef.current();

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    // Unique channel topic per subscription instance to eliminate any collision with lingering/reconnecting channels
    const channelTopic = `user-notifications:${userId}:${Math.random().toString(36).slice(2, 9)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase.channel(channelTopic);
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchUnreadCountRef.current(true);
            if (isOpenRef.current) {
              fetchLatestNotificationsRef.current();
            }
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.warn("[NotificationBell] Realtime channel error; will fallback to focus/poll");
          }
        });
    } catch (err) {
      console.warn("[NotificationBell] Error subscribing to realtime notifications:", err);
    }

    return () => {
      try {
        if (channel) {
          supabase.removeChannel(channel);
        }
      } catch {
        // Safe ignore
      }
    };
  }, [user?.id, setGlobalCount]);

  // Fetch list when dropdown is opened
  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchLatestNotifications();
      fetchUnreadCount();
    }
  };

  // Close dropdown on outside click or ESC key
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "same-origin",
      });
      if (res.ok) {
        setGlobalCount(0);
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() }))
        );
      }
    } catch {
      // Quiet fail
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Handle clicking a single notification
  const handleItemClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setGlobalCount(Math.max(0, unreadCount - 1));

      try {
        await fetch(`/api/notifications/${item.id}/read`, {
          method: "PATCH",
          credentials: "same-origin",
        });
      } catch {
        // Optimistic update retained
      }
    }

    setIsOpen(false);
    const destination = item.action_url || "/profile/notifications";
    router.push(destination);
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        className="relative p-2 rounded-xl text-brand-dark hover:text-brand-pink hover:bg-brand-warm-subtle border border-brand-warm-border/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-brand-pink to-brand-orange text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in-75 duration-150">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-brand-warm-border bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-4 py-3 border-b border-brand-warm-border/70 flex items-center justify-between bg-brand-warm-subtle/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-brand-dark">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-brand-pink-light text-brand-pink px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-xs font-semibold text-brand-pink hover:text-brand-pink-dark flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-brand-warm-border/50">
            {isLoading ? (
              <div className="p-6 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-pink mx-auto" />
                <p className="text-xs text-brand-muted">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-rose-600 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={fetchLatestNotifications}
                  className="text-xs font-semibold text-brand-pink hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-brand-warm flex items-center justify-center mx-auto text-brand-muted">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-brand-dark">All caught up!</p>
                <p className="text-[11px] text-brand-muted">You have no new notifications.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-brand-warm-subtle/70 ${
                    !item.is_read ? "bg-brand-pink-light/20" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-brand-warm-border flex items-center justify-center shrink-0 shadow-xs">
                    {getNotificationTypeIcon(item.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs truncate ${!item.is_read ? "font-bold text-brand-dark" : "font-medium text-brand-dark/80"}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-brand-muted shrink-0">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-brand-muted line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  </div>

                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-brand-pink shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-brand-warm-border/70 bg-brand-warm-subtle/30 text-center">
            <Link
              href="/profile/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-pink hover:text-brand-pink-dark py-1.5 px-3 rounded-lg hover:bg-brand-pink-light/40 transition-colors w-full"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationBell({ className = "" }: { className?: string }) {
  return (
    <BellErrorBoundary>
      <NotificationBellInner className={className} />
    </BellErrorBoundary>
  );
}

