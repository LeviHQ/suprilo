import { NextResponse, after } from "next/server";
import { isValidCardSlug } from "@/lib/slug";
import {
  computeVisitorHash,
  recordCardTelemetry,
  getSupabaseAdminClient,
} from "@/lib/server/card-recipient";
import { dispatchPendingPushDeliveries } from "@/lib/server/push-dispatcher";

export const dynamic = "force-dynamic";

/**
 * Recipient Reveal Telemetry Endpoint
 * POST /api/cards/[slug]/reveal
 *
 * Increments the card's reveals count upon successful scratch reveal past threshold.
 * Enforces server-side 15-minute cooldown per visitor hash via database atomic claim.
 * Non-blocking: always returns clean JSON and never interrupts the recipient experience.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug || !isValidCardSlug(slug)) {
      return NextResponse.json(
        { success: false, error: "INVALID_CARD_SLUG" },
        { status: 400 }
      );
    }

    const visitorHash = computeVisitorHash(request.headers);
    const recorded = await recordCardTelemetry(slug, "reveal", visitorHash);

    // If a reveal was newly recorded, enqueue notification and trigger immediate push dispatch
    if (recorded) {
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        try {
          const { data: cardRow } = await adminClient
            .from("cards")
            .select("id, user_id, recipient_name")
            .eq("slug", slug)
            .maybeSingle();

          if (cardRow?.user_id) {
            await adminClient.rpc("enqueue_notification_safe", {
              p_user_id: cardRow.user_id,
              p_type: "CARD_REVEAL",
              p_title: "Card Scratched!",
              p_body: `Someone just revealed your scratch card for ${cardRow.recipient_name || "a friend"}!`,
              p_dedup_key: `reveal:${cardRow.id}:${visitorHash.slice(0, 16)}:${Math.floor(Date.now() / 60000)}`,
              p_metadata: { card_id: cardRow.id, slug, url: `/c/${slug}` },
            });

            await adminClient.rpc("evaluate_user_achievements", {
              p_user_id: cardRow.user_id,
            });
          }
        } catch (enqueueErr) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[api/cards/[slug]/reveal] Notification enqueue warning:", enqueueErr);
          }
        }
      }

      after(async () => {
        try {
          await dispatchPendingPushDeliveries(20);
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[api/cards/[slug]/reveal] Immediate push dispatch warning:", err);
          }
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        recorded,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/cards/[slug]/reveal] Telemetry error:", err);
    }

    return NextResponse.json(
      {
        success: true,
        recorded: false,
      },
      { status: 200 }
    );
  }
}

