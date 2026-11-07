import { NextResponse } from "next/server";
import { isValidCardSlug } from "@/lib/slug";
import {
  computeVisitorHash,
  recordCardTelemetry,
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

    // If a reveal was newly recorded, trigger immediate push dispatch in background (fire-and-forget)
    if (recorded) {
      dispatchPendingPushDeliveries(5).catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[api/cards/[slug]/reveal] Immediate push dispatch warning:", err);
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

