/**
 * Server-Side Settings Notification Dispatcher
 * Dispatches authoritative in-app ledger notifications and triggers Web Push
 * for account settings, identity, and privacy updates.
 */

import { after } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { dispatchPendingPushDeliveries } from "@/lib/server/push-dispatcher";

/**
 * Dispatches an in-app notification and triggers background push delivery.
 */
async function enqueueSettingsNotification(
  userId: string,
  title: string,
  body: string,
  dedupKey: string,
  url: string,
  pushIntended: boolean = false
): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return;

  try {
    await adminClient.rpc("enqueue_notification_safe", {
      p_user_id: userId,
      p_type: "SYSTEM",
      p_title: title,
      p_body: body,
      p_dedup_key: dedupKey,
      p_metadata: {
        url,
        section: url.split("#")[1] || "settings",
        push_intended: pushIntended,
      },
    });

    after(async () => {
      try {
        await dispatchPendingPushDeliveries(10);
      } catch {
        // Safe ignore
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[settings-notifications] Error enqueuing notification:", err);
    }
  }
}

export async function notifyDisplayNameUpdated(userId: string, newName: string): Promise<void> {
  const dedupKey = `settings:name:${userId}:${Math.floor(Date.now() / 60000)}`;
  await enqueueSettingsNotification(
    userId,
    "Display Name Updated",
    `Your public creator name is now "${newName}".`,
    dedupKey,
    "/profile/settings#profile-identity",
    true
  );
}

export async function notifyHandleReserved(
  userId: string,
  handle: string,
  nextEligibleDate?: string | null
): Promise<void> {
  const dedupKey = `settings:handle:${userId}:${Date.now()}`;
  const lockNotice = nextEligibleDate
    ? ` Next change allowed after ${nextEligibleDate}.`
    : " Handle is locked for 30 days.";
  await enqueueSettingsNotification(
    userId,
    "Creator Handle Reserved",
    `Handle @${handle} is active and reserved for your showcase.${lockNotice}`,
    dedupKey,
    "/profile/settings#creator-handle",
    true
  );
}

export async function notifyBioUpdated(userId: string): Promise<void> {
  const dedupKey = `settings:bio:${userId}:${Math.floor(Date.now() / 60000)}`;
  await enqueueSettingsNotification(
    userId,
    "Profile Bio Updated",
    "Your creator bio was successfully saved.",
    dedupKey,
    "/profile/settings#profile-identity",
    false
  );
}

export async function notifyAvatarUpdated(userId: string): Promise<void> {
  const dedupKey = `settings:avatar:${userId}:${Math.floor(Date.now() / 60000)}`;
  await enqueueSettingsNotification(
    userId,
    "Avatar Changed",
    "Your creator profile photo was successfully updated.",
    dedupKey,
    "/profile/settings#avatar-studio",
    false
  );
}

export async function notifyPrivacyUpdated(userId: string, enabled: boolean): Promise<void> {
  const dedupKey = `settings:privacy:${userId}:${Math.floor(Date.now() / 60000)}`;
  await enqueueSettingsNotification(
    userId,
    "Card Privacy Updated",
    `Card analytics collection on your shared surprise cards is now ${enabled ? "enabled" : "disabled"}.`,
    dedupKey,
    "/profile/settings#data-privacy",
    false
  );
}

export async function notifyDataExported(userId: string): Promise<void> {
  const dedupKey = `settings:export:${userId}:${Date.now()}`;
  await enqueueSettingsNotification(
    userId,
    "Creator Data Exported",
    "A full JSON backup containing your cards, metrics, and achievements was generated and downloaded.",
    dedupKey,
    "/profile/settings#data-privacy",
    false
  );
}
