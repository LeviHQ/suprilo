// Centralized In-Memory Notification Count Manager with Request Deduplication & 30s TTL
// Eliminates redundant network requests across Navbar, DashboardHeader, Sidebar, and MobileNav.

import * as React from "react";

type Listener = (count: number) => void;

let cachedCount = 0;
let lastFetchedAt = 0;
let inflightPromise: Promise<number> | null = null;
const listeners = new Set<Listener>();
let hasInitializedWindowListeners = false;

export function getCachedUnreadCount(): number {
  return cachedCount;
}

export function subscribeToUnreadCount(listener: Listener): () => void {
  listeners.add(listener);
  // Send current cached value immediately
  listener(cachedCount);
  return () => {
    listeners.delete(listener);
  };
}

export function setGlobalUnreadCount(count: number) {
  cachedCount = Math.max(0, count);
  lastFetchedAt = Date.now();
  listeners.forEach((fn) => {
    try {
      fn(cachedCount);
    } catch {
      // Ignore listener errors
    }
  });
}

export async function refreshUnreadCount(force = false): Promise<number> {
  const now = Date.now();
  // 30-second TTL cache: Return cached count if fetched recently
  if (!force && now - lastFetchedAt < 30000 && lastFetchedAt > 0) {
    return cachedCount;
  }

  // Deduplicate concurrent inflight requests
  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", {
        credentials: "same-origin",
      });
      if (res.ok) {
        const json = await res.json();
        const count = json?.data?.unread_count ?? json?.unread_count ?? 0;
        setGlobalUnreadCount(count);
        return count;
      }
    } catch {
      // Quiet fail on network hiccups
    } finally {
      inflightPromise = null;
    }
    return cachedCount;
  })();

  return inflightPromise;
}

// Single centralized window listener initialization with 30s throttle
function initWindowFocusListener() {
  if (typeof window === "undefined" || hasInitializedWindowListeners) return;
  hasInitializedWindowListeners = true;

  const onFocusOrVisible = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      // refreshUnreadCount automatically respects the 30-second TTL
      refreshUnreadCount();
    }
  };

  window.addEventListener("focus", onFocusOrVisible);
  document.addEventListener("visibilitychange", onFocusOrVisible);
}

// Custom React hook for seamless integration in any component
export function useUnreadNotificationsCount(): {
  unreadCount: number;
  refresh: (force?: boolean) => Promise<number>;
  setCount: (count: number) => void;
} {
  const [count, setCountState] = React.useState<number>(() => getCachedUnreadCount());

  React.useEffect(() => {
    initWindowFocusListener();
    const unsubscribe = subscribeToUnreadCount((newCount) => {
      setCountState(newCount);
    });
    return unsubscribe;
  }, []);

  return {
    unreadCount: count,
    refresh: refreshUnreadCount,
    setCount: setGlobalUnreadCount,
  };
}
