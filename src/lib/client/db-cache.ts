// ============================================================================
// Suprilo — Unified SWR In-Memory Database Cache Engine
//
// Purpose: Eliminates loading delays across Studio Hub, Badges, and Analytics
//          by providing instant (0ms) Stale-While-Revalidate responses,
//          request deduplication, and optimistic mutations.
// ============================================================================

import * as React from "react";
import type { CardRecord } from "@/types/card";
import type { UserBadgeSummary, UserBadgeRecord } from "@/types/badges";
import { getUserCardsWithMetrics } from "@/lib/cards";
import {
  getUserBadgesSummary,
  getUserUnlockedBadges,
  recordStudioVisit,
} from "@/lib/badges/service";
import type { SupriloUser } from "@/context/AuthContext";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inflightPromises = new Map<string, Promise<unknown>>();
const subscribers = new Map<string, Set<(data: unknown) => void>>();

/**
 * Subscribes a listener to updates for a specific cache key.
 */
function subscribe(key: string, callback: (data: unknown) => void): () => void {
  let set = subscribers.get(key);
  if (!set) {
    set = new Set();
    subscribers.set(key, set);
  }
  set.add(callback);
  return () => {
    set?.delete(callback);
    if (set && set.size === 0) {
      subscribers.delete(key);
    }
  };
}

/**
 * Notifies all active subscribers of updated data for a cache key.
 */
function notifySubscribers<T>(key: string, data: T) {
  const set = subscribers.get(key);
  if (set) {
    set.forEach((fn) => {
      try {
        fn(data);
      } catch {
        // Safe ignore
      }
    });
  }
}

/**
 * Retrieves an entry from cache if it exists (fresh or stale).
 */
export function getCachedData<T>(key: string): T | undefined {
  const entry = memoryCache.get(key);
  return entry ? (entry.data as T) : undefined;
}

/**
 * Checks if a cached entry is within its fresh TTL window.
 */
export function isCacheFresh(key: string): boolean {
  const entry = memoryCache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttlMs;
}

/**
 * Mutates a cache entry optimistically and notifies all active listeners in 0ms.
 */
export function mutateCache<T>(key: string, updater: T | ((prev: T | undefined) => T)) {
  const current = getCachedData<T>(key);
  const nextData = typeof updater === "function" ? (updater as (prev: T | undefined) => T)(current) : updater;

  const currentEntry = memoryCache.get(key);
  memoryCache.set(key, {
    data: nextData,
    timestamp: Date.now(),
    ttlMs: currentEntry?.ttlMs || 60000,
  });

  notifySubscribers(key, nextData);
}

/**
 * Invalidates a specific cache key or all keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix?: string) {
  if (!keyOrPrefix) {
    memoryCache.clear();
    return;
  }
  for (const k of memoryCache.keys()) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) {
      memoryCache.delete(k);
    }
  }
}

/**
 * Core Stale-While-Revalidate executor with inflight deduplication.
 */
export async function executeWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 45000,
  force = false
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);

  // 1. Fresh cache: Return instantly without background network call
  if (!force && cached && now - cached.timestamp < cached.ttlMs) {
    return cached.data as T;
  }

  // 2. Deduplicate inflight requests for the exact same key
  if (inflightPromises.has(key)) {
    return inflightPromises.get(key) as Promise<T>;
  }

  // 3. Initiate background revalidation
  const fetchPromise = (async () => {
    try {
      const freshData = await fetcher();
      memoryCache.set(key, {
        data: freshData,
        timestamp: Date.now(),
        ttlMs,
      });
      notifySubscribers(key, freshData);
      return freshData;
    } finally {
      inflightPromises.delete(key);
    }
  })();

  inflightPromises.set(key, fetchPromise);

  // 4. Stale-While-Revalidate: If we have existing data (even if stale), return it immediately
  // while the fetcher runs silently in the background
  if (!force && cached) {
    return cached.data as T;
  }

  return fetchPromise;
}

// ============================================================================
// Custom React Hooks
// ============================================================================

/**
 * High-performance hook for user surprise cards.
 * Returns cached cards in 0ms on route transitions, then silently revalidates with database.
 */
export function useUserCardsData(user: SupriloUser | null) {
  const userId = user?.id || user?.uid || null;
  const cacheKey = userId ? `cards:${userId}` : null;

  const [cards, setCards] = React.useState<CardRecord[]>(() => {
    return cacheKey ? (getCachedData<CardRecord[]>(cacheKey) || []) : [];
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(() => {
    if (!cacheKey) return false;
    return !getCachedData<CardRecord[]>(cacheKey);
  });
  const [error, setError] = React.useState<string | null>(null);

  const fetchCards = React.useCallback(
    async (force = false) => {
      if (!cacheKey) return [];
      try {
        const data = await executeWithSWR(
          cacheKey,
          () => getUserCardsWithMetrics(),
          45000, // 45 seconds fresh TTL
          force
        );
        setCards(data);
        setError(null);
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load cards.";
        setError(msg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [cacheKey]
  );

  React.useEffect(() => {
    if (!cacheKey) {
      setCards([]);
      setIsLoading(false);
      return;
    }

    // Subscribe to cross-tab / cross-component cache updates
    const unsubscribe = subscribe(cacheKey, (freshData) => {
      setCards(freshData as CardRecord[]);
    });

    // Check if initial cached data exists
    const initial = getCachedData<CardRecord[]>(cacheKey);
    if (initial) {
      setCards(initial);
      setIsLoading(false);
    }

    // Trigger SWR fetch
    fetchCards();

    return unsubscribe;
  }, [cacheKey, fetchCards]);

  const mutate = React.useCallback(
    (updater: CardRecord[] | ((prev: CardRecord[]) => CardRecord[])) => {
      if (!cacheKey) return;
      mutateCache<CardRecord[]>(cacheKey, (prev) => {
        const current = prev || [];
        return typeof updater === "function" ? updater(current) : updater;
      });
    },
    [cacheKey]
  );

  return {
    cards,
    isLoading,
    error,
    refresh: () => fetchCards(true),
    mutate,
  };
}

/**
 * High-performance hook for gamification summary and unlocked badges.
 * Returns cached overview in 0ms on route transitions, then silently revalidates with database.
 */
export function useUserBadgesData(user: SupriloUser | null) {
  const userId = user?.id || user?.uid || null;
  const summaryKey = userId ? `badge_summary:${userId}` : null;
  const listKey = userId ? `badge_list:${userId}` : null;

  const [summary, setSummary] = React.useState<UserBadgeSummary | null>(() => {
    return summaryKey ? (getCachedData<UserBadgeSummary>(summaryKey) || null) : null;
  });
  const [unlockedBadges, setUnlockedBadges] = React.useState<UserBadgeRecord[]>(() => {
    return listKey ? (getCachedData<UserBadgeRecord[]>(listKey) || []) : [];
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(() => {
    if (!summaryKey) return false;
    return !getCachedData<UserBadgeSummary>(summaryKey);
  });
  const [error, setError] = React.useState<string | null>(null);

  const fetchBadges = React.useCallback(
    async (force = false) => {
      if (!userId || !summaryKey || !listKey) return;
      try {
        // Fire-and-forget session studio visit without blocking badge queries
        recordStudioVisit(userId).catch(() => {});

        // Fetch summary and badge records concurrently in parallel
        const [sumData, badgeData] = await Promise.all([
          executeWithSWR(summaryKey, () => getUserBadgesSummary(userId), 60000, force),
          executeWithSWR(listKey, () => getUserUnlockedBadges(userId), 60000, force),
        ]);

        if (sumData) setSummary(sumData);
        if (badgeData) setUnlockedBadges(badgeData);
        setError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load badges.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, summaryKey, listKey]
  );

  React.useEffect(() => {
    if (!userId || !summaryKey || !listKey) {
      setSummary(null);
      setUnlockedBadges([]);
      setIsLoading(false);
      return;
    }

    const unsubs1 = subscribe(summaryKey, (fresh) => setSummary(fresh as UserBadgeSummary));
    const unsubs2 = subscribe(listKey, (fresh) => setUnlockedBadges(fresh as UserBadgeRecord[]));

    const initSummary = getCachedData<UserBadgeSummary>(summaryKey);
    const initList = getCachedData<UserBadgeRecord[]>(listKey);
    if (initSummary) setSummary(initSummary);
    if (initList) setUnlockedBadges(initList);
    if (initSummary && initList) setIsLoading(false);

    fetchBadges();

    return () => {
      unsubs1();
      unsubs2();
    };
  }, [userId, summaryKey, listKey, fetchBadges]);

  return {
    summary,
    unlockedBadges,
    isLoading,
    error,
    refresh: () => fetchBadges(true),
  };
}

