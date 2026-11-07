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
  Sliders,
  Check,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { createClient } from "@/lib/supabase/client";

interface NotificationItem {
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

type TabType = "all" | "unread" | "read" | "preferences";

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
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function getNotificationTypeIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "CARD_REVEAL":
      return <Sparkles className="w-5 h-5 text-brand-pink" />;
    case "BADGE_UNLOCKED":
      return <Award className="w-5 h-5 text-brand-orange" />;
    case "LEVEL_UP":
      return <TrendingUp className="w-5 h-5 text-emerald-600" />;
    case "SYSTEM":
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
}

function getNotificationBadge(type: NotificationItem["type"]) {
  switch (type) {
    case "CARD_REVEAL":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-brand-pink border border-pink-100">Reveal</span>;
    case "BADGE_UNLOCKED":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-brand-orange border border-amber-100">Badge</span>;
    case "LEVEL_UP":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Level Up</span>;
    case "SYSTEM":
    default:
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">System</span>;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = React.useState<TabType>("all");
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = React.useState<boolean>(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch unread count
  const fetchUnreadCount = React.useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications/unread-count", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unread_count === "number") {
          setUnreadCount(data.unread_count);
        }
      }
    } catch {
      // Quiet fail
    }
  }, [user]);

  // Fetch notifications for the selected filter tab
  const fetchNotifications = React.useCallback(async (tab: TabType) => {
    if (!user || tab === "preferences") return;
    setIsLoading(true);
    setError(null);

    const filterParam = tab === "unread" ? "unread" : tab === "read" ? "read" : "all";

    try {
      const res = await fetch(`/api/notifications?filter=${filterParam}&limit=20`, {
        credentials: "same-origin",
      });

      if (!res.ok) {
        throw new Error("Failed to load notifications.");
      }

      const json = await res.json();
      const items: NotificationItem[] = json?.data?.items || [];
      setNotifications(items);
      setNextCursor(json?.data?.next_cursor || null);
      setHasMore(Boolean(json?.data?.has_more));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load More cursor pagination
  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore || !user) return;
    setIsLoadingMore(true);

    const filterParam = activeTab === "unread" ? "unread" : activeTab === "read" ? "read" : "all";

    try {
      const res = await fetch(
        `/api/notifications?filter=${filterParam}&limit=20&cursor=${encodeURIComponent(nextCursor)}`,
        { credentials: "same-origin" }
      );

      if (!res.ok) throw new Error("Failed to load more notifications.");

      const json = await res.json();
      const newItems: NotificationItem[] = json?.data?.items || [];

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const filteredNew = newItems.filter((n) => !existingIds.has(n.id));
        return [...prev, ...filteredNew];
      });

      setNextCursor(json?.data?.next_cursor || null);
      setHasMore(Boolean(json?.data?.has_more));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Load more failed.";
      setError(msg);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Initial load and tab changes
  React.useEffect(() => {
    fetchUnreadCount();
    if (activeTab !== "preferences") {
      fetchNotifications(activeTab);
    }
  }, [activeTab, fetchNotifications, fetchUnreadCount]);

  const activeTabRef = React.useRef(activeTab);
  activeTabRef.current = activeTab;

  const fetchNotificationsRef = React.useRef(fetchNotifications);
  fetchNotificationsRef.current = fetchNotifications;

  const fetchUnreadCountRef = React.useRef(fetchUnreadCount);
  fetchUnreadCountRef.current = fetchUnreadCount;

  // Realtime subscription for instant notification feed and unread badge updates
  React.useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channelTopic = `profile-notifications:${userId}:${Math.random().toString(36).slice(2, 9)}`;
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
            fetchUnreadCountRef.current();
            if (activeTabRef.current !== "preferences") {
              fetchNotificationsRef.current(activeTabRef.current);
            }
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.warn("[ProfileNotifications] Realtime channel error, fallback to refresh");
          }
        });
    } catch (err) {
      console.warn("[ProfileNotifications] Error subscribing to realtime notifications:", err);
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
  }, [user?.id]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "same-origin",
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        if (activeTab === "unread") {
          setNotifications([]);
        }
      }
    } catch {
      // Quiet fail
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Toggle individual notification read state
  const handleToggleRead = async (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextReadState = !item.is_read;
    setTogglingId(item.id);

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: nextReadState } : n))
    );
    setUnreadCount((prev) => (nextReadState ? Math.max(0, prev - 1) : prev + 1));

    try {
      await fetch(`/api/notifications/${item.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ read: nextReadState }),
      });
    } catch {
      // Revert if failed
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: item.is_read } : n))
      );
      setUnreadCount((prev) => (nextReadState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setTogglingId(null);
    }
  };

  // Handle clicking a notification card to navigate
  const handleItemNavigation = async (item: NotificationItem) => {
    if (!item.is_read) {
      // Mark as read in background
      fetch(`/api/notifications/${item.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ read: true }),
      }).catch(() => {});
    }

    if (item.action_url) {
      router.push(item.action_url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Notifications"
        description="Stay informed with real-time alerts on card reveals, badge achievements, and milestone level-ups."
        badge={unreadCount > 0 ? `${unreadCount} Unread` : undefined}
        badgeVariant="pink"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Notifications" },
        ]}
        actions={
          activeTab !== "preferences" && unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="gap-2 text-xs font-semibold text-brand-pink hover:text-brand-pink-dark border-brand-pink/30 hover:bg-brand-pink-light/30"
            >
              {isMarkingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              <span>Mark all as read</span>
            </Button>
          ) : undefined
        }
      />

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-brand-warm-border pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "all"
              ? "border-brand-pink text-brand-pink"
              : "border-transparent text-brand-muted hover:text-brand-dark"
          }`}
        >
          <span>All</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "unread"
              ? "border-brand-pink text-brand-pink"
              : "border-transparent text-brand-muted hover:text-brand-dark"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-pink text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("read")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "read"
              ? "border-brand-pink text-brand-pink"
              : "border-transparent text-brand-muted hover:text-brand-dark"
          }`}
        >
          <span>Read</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ml-auto ${
            activeTab === "preferences"
              ? "border-brand-pink text-brand-pink"
              : "border-transparent text-brand-muted hover:text-brand-dark"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Preferences & Push</span>
        </button>
      </div>

      {/* Preferences Panel Tab */}
      {activeTab === "preferences" ? (
        <NotificationPreferencesPanel />
      ) : (
        /* Notifications List */
        <div className="space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => fetchNotifications(activeTab)}
                className="text-brand-pink hover:underline font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-brand-warm-border p-4 sm:p-5 flex items-start gap-4 animate-pulse"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={
                activeTab === "unread"
                  ? "No unread notifications"
                  : activeTab === "read"
                  ? "No read notifications"
                  : "No notifications yet"
              }
              description={
                activeTab === "unread"
                  ? "You're all caught up! New reveals, achievements, and milestone level-ups will appear here."
                  : "When cards are scratched or badges are unlocked, notifications will be displayed here."
              }
              action={
                <Link href="/create">
                  <Button variant="primary" size="sm" className="gap-1.5 shadow-md">
                    <Sparkles className="w-4 h-4" />
                    <span>Create a Scratch Card</span>
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemNavigation(item)}
                  className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 cursor-pointer hover:border-brand-pink/50 hover:shadow-md ${
                    !item.is_read
                      ? "border-brand-pink/30 bg-gradient-to-r from-pink-50/20 to-transparent"
                      : "border-brand-warm-border"
                  }`}
                >
                  {/* Type Icon */}
                  <div className="w-10 h-10 rounded-xl bg-brand-warm flex items-center justify-center shrink-0 shadow-xs border border-brand-warm-border/60">
                    {getNotificationTypeIcon(item.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getNotificationBadge(item.type)}
                      <h4
                        className={`text-sm tracking-tight truncate ${
                          !item.is_read ? "font-extrabold text-brand-dark" : "font-semibold text-brand-dark/90"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[11px] text-brand-muted ml-auto shrink-0">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-brand-muted leading-relaxed">
                      {item.body}
                    </p>

                    {item.action_url && (
                      <div className="pt-1.5 flex items-center gap-1 text-xs font-bold text-brand-pink hover:underline">
                        <span>View details</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Mark Read/Unread Action Button */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(item, e)}
                      disabled={togglingId === item.id}
                      aria-label={item.is_read ? "Mark as unread" : "Mark as read"}
                      title={item.is_read ? "Mark as unread" : "Mark as read"}
                      className={`p-2 rounded-xl transition-colors ${
                        item.is_read
                          ? "text-brand-muted hover:text-brand-dark hover:bg-brand-warm"
                          : "text-brand-pink hover:bg-brand-pink-light/40"
                      }`}
                    >
                      {togglingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : item.is_read ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4 font-bold" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="gap-2 text-xs font-semibold shadow-xs"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-pink" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-brand-pink" />
                    )}
                    <span>{isLoadingMore ? "Loading more..." : "Load Older Notifications"}</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

