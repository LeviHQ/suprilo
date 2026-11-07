# Suprilo Notification System — Engineering & Architectural Specification
**Document ID:** `SPEC-2C-5.7.0-FINAL`  
**Version:** `1.0.0` (Canonical Baseline for In-App & Browser Push Notifications)  
**Status:** `CANONICAL SPECIFICATION — AUTHORITATIVE BLUEPRINT`  
**Target Repository:** `d:\My Projects\suprilo`  
**Created:** November 2026  
**Author:** Antigravity Agentic Engineering Team

---

## 1. Executive Summary & Document Control

This specification serves as the official, authoritative architectural blueprint for the **Suprilo Notification System** (In-App Notification Center + Web Push Notifications). All future modifications, database migrations, backend workers, API routes, and user interface components related to notifications must strictly conform to this document.

### 1.1 Core Principles
1. **Zero Client-Side Creation (Anti-Spoofing):** Clients are prohibited from executing direct `INSERT` operations on the notifications table. Notifications are minted exclusively by server-side `SECURITY DEFINER` stored procedures or verified server-side route handlers running with `service_role` privileges.
2. **Multi-Tenant Row-Level Security Isolation:** Notification data is partitioned strictly by `recipient_user_id`. PostgreSQL Row Level Security (RLS) guarantees that authenticated users can only view, mark as read, or delete their own notifications.
3. **Channel Decoupling:** In-app notifications and browser push notifications operate with decoupled resilience. If browser push permission is denied, revoked, or unsupported (e.g. non-PWA iOS Safari), in-app notifications continue to function seamlessly without degraded experience.
4. **Strict 30-Day Retention Window:** All notifications (regardless of whether they are read or unread) expire 30 days after creation (`created_at`) and are automatically pruned by a daily scheduled batch worker.
5. **100% Free-Tier Architecture:** Built natively on Supabase PostgreSQL (RLS + Realtime) and the open W3C Push API / RFC 8291/8292 standard using VAPID keys, requiring zero paid third-party notification SaaS providers (e.g., OneSignal, Novu, Courier).

---

## 2. Event Matrix & Notification Catalog

The platform triggers notifications for five distinct lifecycle events:

| Event Type Enum | User-Facing Title | Content Template | Icon Name | Action Target URL | Trigger Origin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `card_revealed` | **Card Revealed!** | *"Someone just scratched and revealed your surprise card for {{recipient_name}}!"* | `eye` | `/profile/analytics` | `public.record_card_reveal` (`POST /api/telemetry/reveal`) |
| `badge_unlocked` | **Badge Unlocked!** | *"Congratulations! You unlocked the '{{badge_name}}' badge (+{{points}} XP)!"* | `award` | `/profile/badges` | `public.award_badge_internal` (`evaluate_user_achievements`) |
| `level_up` | **Level Up!** | *"You achieved Level {{new_level}} — {{level_title}}! Keep crafting unforgettable surprises!"* | `zap` | `/profile/badges` | `public.evaluate_user_achievements` |
| `referral_joined` | **New Referral!** | *"A new creator joined Suprilo using your referral invite link!"* | `users` | `/profile/referral` | Future Referral Engine |
| `system_announcement` | **Suprilo Announcement** | *"{{announcement_message}}"* | `sparkles` | `{{custom_url}}` | Administrative Dispatch |

---

## 3. Database Architecture & Schema Specification

The notification engine requires three new tables in the `public` schema, backed by strict RLS and indexing.

### 3.1 Custom Types & Enums
```sql
CREATE TYPE public.notification_type AS ENUM (
  'card_revealed',
  'badge_unlocked',
  'level_up',
  'referral_joined',
  'system_announcement'
);
```

### 3.2 Table: `public.notifications`
Core ledger of in-app notifications.

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL
    CONSTRAINT chk_notifications_title_len CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
  body text NOT NULL
    CONSTRAINT chk_notifications_body_len CHECK (char_length(trim(body)) BETWEEN 1 AND 500),
  icon_type text NOT NULL DEFAULT 'bell'
    CONSTRAINT chk_notifications_icon_type CHECK (icon_type IN ('bell', 'eye', 'award', 'zap', 'users', 'sparkles')),
  action_url text NULL
    CONSTRAINT chk_notifications_action_url CHECK (action_url IS NULL OR action_url ~ '^/[a-zA-Z0-9/_-]*$'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- Performance Indexes
CREATE INDEX idx_notifications_recipient_feed
  ON public.notifications (recipient_user_id, created_at DESC);

CREATE INDEX idx_notifications_recipient_unread
  ON public.notifications (recipient_user_id)
  WHERE is_read = false;

CREATE INDEX idx_notifications_cleanup
  ON public.notifications (created_at);
```

### 3.3 Table: `public.push_subscriptions`
Stores browser Web Push endpoints and encryption keys per authenticated user device.

```sql
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  last_used_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions (user_id);
```

### 3.4 Table: `public.notification_preferences`
User-controlled opt-in/opt-out toggles.

```sql
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  notify_on_reveal boolean NOT NULL DEFAULT true,
  notify_on_badge boolean NOT NULL DEFAULT true,
  notify_on_referral boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
```

---

## 4. Row Level Security & Explicit Privilege Matrix

```sql
-- 1. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 2. Revoke default public privileges
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.push_subscriptions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.notification_preferences FROM PUBLIC, anon, authenticated;

-- 3. Grants & Policies: public.notifications
-- Authenticated users can SELECT, UPDATE (read state only), and DELETE their own notifications
GRANT SELECT, DELETE ON TABLE public.notifications TO authenticated;
GRANT UPDATE (is_read, read_at) ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

CREATE POLICY "notifications_owner_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "notifications_owner_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);

CREATE POLICY "notifications_owner_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = recipient_user_id);

-- ZERO direct INSERT grant to authenticated role (Must route via internal functions / service_role)

-- 4. Grants & Policies: public.push_subscriptions
GRANT SELECT, INSERT, DELETE ON TABLE public.push_subscriptions TO authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;

CREATE POLICY "push_subscriptions_owner_all"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Grants & Policies: public.notification_preferences
GRANT SELECT, INSERT, UPDATE ON TABLE public.notification_preferences TO authenticated;
GRANT ALL ON TABLE public.notification_preferences TO service_role;

CREATE POLICY "notification_preferences_owner_all"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 5. PostgreSQL Maintenance & Lifecycle Functions

### 5.1 Automated 30-Day Pruning Procedure
```sql
CREATE OR REPLACE FUNCTION public.prune_expired_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  -- Strict 30-day retention rule: deletes read and unread notifications older than 30 days
  DELETE FROM public.notifications
  WHERE created_at < clock_timestamp() - interval '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_expired_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_expired_notifications() TO service_role;
```

### 5.2 Atomic Mark-All-As-Read Procedure
```sql
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_updated integer := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  UPDATE public.notifications
  SET is_read = true,
      read_at = clock_timestamp()
  WHERE recipient_user_id = v_user_id
    AND is_read = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated, service_role;
```

### 5.3 Realtime Publication
```sql
-- Enables real-time websocket broadcasts on notification inserts for instant UI updating
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

---

## 6. Server-Side Push Engine & Dispatcher Architecture

### 6.1 Server Dispatcher: `src/lib/server/notifications.ts`
All notification dispatching is orchestrated by a unified server-side module:

```typescript
export interface DispatchNotificationParams {
  recipientUserId: string;
  type: 'card_revealed' | 'badge_unlocked' | 'level_up' | 'referral_joined' | 'system_announcement';
  title: string;
  body: string;
  iconType?: 'bell' | 'eye' | 'award' | 'zap' | 'users' | 'sparkles';
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function dispatchNotification(params: DispatchNotificationParams): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return;

  // 1. Insert in-app notification row
  const { data: notification, error: insertError } = await adminClient
    .from('notifications')
    .insert({
      recipient_user_id: params.recipientUserId,
      type: params.type,
      title: params.title,
      body: params.body,
      icon_type: params.iconType || 'bell',
      action_url: params.actionUrl || null,
      metadata: params.metadata || {},
    })
    .select('id')
    .single();

  if (insertError || !notification) return;

  // 2. Fetch recipient push preference and active subscriptions
  const { data: preferences } = await adminClient
    .from('notification_preferences')
    .select('push_enabled')
    .eq('user_id', params.recipientUserId)
    .single();

  if (preferences && !preferences.push_enabled) return;

  const { data: subscriptions } = await adminClient
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', params.recipientUserId);

  if (!subscriptions || subscriptions.length === 0) return;

  // 3. Dispatch Web Push with VAPID signatures
  const payload = JSON.stringify({
    title: params.title,
    body: params.body,
    icon: '/brand/favicon.png',
    badge: '/brand/favicon.png',
    data: {
      url: params.actionUrl || '/profile/notifications',
      notificationId: notification.id,
    },
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      );
    } catch (err: any) {
      // 4. Stale device endpoint cleanup: HTTP 404 or 410 indicates expired subscription
      if (err.statusCode === 404 || err.statusCode === 410) {
        await adminClient
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id);
      }
    }
  }
}
```

---

## 7. Client Service Worker & Push Client Specification

### 7.1 Service Worker: `public/sw.js`
Must reside at root `/public/sw.js` to ensure global scope (`/`):

```javascript
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New update from Suprilo!',
      icon: data.icon || '/brand/favicon.png',
      badge: data.badge || '/brand/favicon.png',
      data: data.data || {},
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(data.title || 'Suprilo', options));
  } catch (e) {
    // Fallback if data is not JSON
    event.waitUntil(
      self.registration.showNotification('Suprilo', {
        body: event.data.text(),
        icon: '/brand/favicon.png',
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/profile/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
```

---

## 8. Frontend Integration Specification

### 8.1 Homepage Integration (`src/components/layout/Navbar.tsx`)
1. **Component:** Create `src/components/layout/NotificationBell.tsx`.
2. **Placement:** Insert between authenticated user profile dropdown and the primary CTA button:
   - Line 211 in [`Navbar.tsx`](file:///d:/My%20Projects/suprilo/src/components/layout/Navbar.tsx#L211): `<NotificationBell />`.
3. **Dropdown Behavior:**
   - Displays live unread count pill if `count > 0` (max format: `"9+"`).
   - Clicking toggles a dropdown popover showing the latest 3 notifications.
   - Each notification item shows:
     - Icon based on `icon_type`.
     - Relative time string (e.g. `"5m ago"`).
     - Bold title and 2-line truncated body.
     - Unread indicator dot.
   - Clicking an item marks it as read and redirects to `action_url`.
   - Popover footer: *"View all notifications"* linking to `/profile/notifications`.

### 8.2 Control Center Navigation Ordering (`src/components/dashboard/navigation.ts`)
The new Notifications section is positioned **strictly at index 6, immediately after Referral**:

```typescript
export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { id: "home",          label: "Home",             href: "/profile",               icon: LayoutDashboard, exact: true },
  { id: "analytics",     label: "Analytics",        href: "/profile/analytics",     icon: BarChart3 },
  { id: "badges",        label: "Badges",           href: "/profile/badges",        icon: Award },
  { id: "billing",       label: "Billing & Usage",  href: "/profile/billing",       icon: CreditCard },
  { id: "referral",      label: "Referral",         href: "/profile/referral",      icon: Users },
  { id: "notifications", label: "Notifications",    href: "/profile/notifications", icon: Bell },
  { id: "settings",      label: "Account Settings", href: "/profile/settings",      icon: Settings },
  { id: "support",       label: "Support Tickets",  href: "/profile/support",       icon: LifeBuoy },
];
```

### 8.3 Control Center Page (`src/app/profile/notifications/page.tsx`)
- **Breadcrumb:** `Control Center / Notifications`.
- **Top Actions:** `"Mark all as read"`, Push Notification Toggle button.
- **Filter Tabs:** `All`, `Unread`, `Read`.
- **List Items:** Rich notification card with relative time, category badge, mark-as-read button, and action navigation.
- **Empty States:** Visual empty states when no notifications are found.
- **Pagination:** 10 items per page with responsive previous/next buttons.

---

## 9. 30-Day Retention & Automated Daily Cleanup

### 9.1 Retention Rule
- Any notification where `created_at < now() - interval '30 days'` is permanently purged.
- The rule applies equally to both `is_read = true` and `is_read = false`.

### 9.2 Execution Mechanism
- **Vercel Cron:** Configured in `vercel.json` to execute once daily at `00:00 UTC`:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/cleanup",
        "schedule": "0 0 * * *"
      }
    ]
  }
  ```
- **Route Handler (`src/app/api/cron/cleanup/route.ts`):**
  - Authenticates request header `Authorization: Bearer ${CRON_SECRET}`.
  - Calls `public.prune_expired_notifications()`.
  - Calls `public.prune_expired_telemetry()`.
  - Returns JSON response: `{ success: true, pruned_notifications: N, pruned_telemetry: M }`.

---

## 10. Legal, Privacy & Compliance Disclosures

Before deploying the notification system, update the following legal files:

### 10.1 Privacy Policy (`src/app/legal/privacy/page.tsx`)
Add disclosure section under data processing:
1. **Push Tokens & Subscriptions:** Explain that browser push tokens (`p256dh`, `auth`, `endpoint`) are stored strictly to deliver creator alerts and are never shared with advertising networks or data brokers.
2. **30-Day Storage Limitation:** Explicitly state that in-app notification records and push dispatch logs are retained for a maximum of 30 days from creation, after which they are permanently and irrevocably deleted.
3. **Revocation Rights:** Explain how users can revoke push notification permissions via browser site settings or through their Suprilo Account Settings.

### 10.2 Terms of Service (`src/app/legal/terms/page.tsx`)
Add service limitations:
1. **Best-Effort Delivery:** Clarify that Web Push notifications depend on third-party device manufacturers and operating systems (e.g. Apple APNs, Google FCM, Mozilla Push Gateway). Delivery is provided on a best-effort basis and is not guaranteed for mission-critical alerts.

---

## 11. Implementation Sequence & Phase Roadmap

All future development must proceed strictly in these sequential phases:

```
┌──────────────────────────────────────────────────────────────┐
│ Phase 2A: Database Schema & Migration                        │
│ - Migration file: public.notifications, push_subscriptions,  │
│   notification_preferences, RLS, pruning function, Realtime  │
├──────────────────────────────────────────────────────────────┤
│ Phase 2B: Backend Core & Push Dispatcher                     │
│ - Install `web-push`, generate & store VAPID keys            │
│ - Implement src/lib/server/notifications.ts                  │
│ - Wire reveal & badge event hooks                            │
│ - Create /api/notifications & /api/cron/cleanup endpoints    │
├──────────────────────────────────────────────────────────────┤
│ Phase 2C: Service Worker & Push Client Hook                  │
│ - Create public/sw.js & public/manifest.json                 │
│ - Create usePushNotifications client hook                    │
├──────────────────────────────────────────────────────────────┤
│ Phase 2D: Frontend UI Integration                            │
│ - Integrate NotificationBell into Navbar.tsx                 │
│ - Add Notifications to src/components/dashboard/navigation.ts│
│ - Build src/app/profile/notifications/page.tsx               │
├──────────────────────────────────────────────────────────────┤
│ Phase 2E: Legal Disclosures & Verification                   │
│ - Update Privacy Policy and Terms of Service                 │
│ - End-to-end multi-browser test (Chrome, Safari, Firefox)    │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Verification & Integrity Checklist

Prior to production deployment, the engineering team must verify:
- [ ] No client can execute `INSERT INTO public.notifications`.
- [ ] Unread count query executes with index backing in under 5ms.
- [ ] Marking a notification read by user A cannot mark user B's notification.
- [ ] Realtime channel unmounts cleanly without socket leaks.
- [ ] Service Worker unregisters or updates cleanly without blocking cache assets.
- [ ] 30-day pruning query deletes both read and unread records older than 30 days.
- [ ] Invalid push endpoints (410 Gone) are immediately expunged from the database.

