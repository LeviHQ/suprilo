import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  getSupabaseAdminClient,
  computeVisitorHash,
  recordCardTelemetry,
} from "@/lib/server/card-recipient";
import {
  computeVisitorHashes,
  isValidUuid,
  SB_VID_COOKIE_NAME,
} from "@/lib/server/visitor-identity";

export const dynamic = "force-dynamic";

/**
 * Recipient Scratch Card Reveal Telemetry Endpoint
 * POST /api/telemetry/reveal
 *
 * Implements SPEC-2C-5.6.1-FINAL v3.0.0 Section 7.1:
 * 1. Validates view_receipt_id authenticity and card binding.
 * 2. Compares stored visitor identity using NULL-safe evaluation.
 * 3. Enforces millisecond-precision boundary (elapsed_ms <= 600,000 ms) for Fast Scratch.
 * 4. Stamped consumption prevents replay attacks.
 * 5. Unified Fallback Policy: If view_receipt_id is missing or rejected,
 *    records standard reveal telemetry without unverified fast-scratch qualification.
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON_BODY" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST_BODY" },
        { status: 400 }
      );
    }

    const { card_id, view_receipt_id, slug } = body as {
      card_id?: string;
      view_receipt_id?: string | null;
      slug?: string;
    };

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    // 1. Unified Fallback Policy: Missing or invalid view_receipt_id
    if (!view_receipt_id || !isValidUuid(view_receipt_id)) {
      if (slug) {
        const headersList = await headers();
        const visitorHash = computeVisitorHash(headersList);
        const recorded = await recordCardTelemetry(slug, "reveal", visitorHash, adminClient);
        return NextResponse.json(
          {
            success: true,
            verified: false,
            fast_scratch: false,
            fallback_recorded: recorded,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "MISSING_RECEIPT_AND_SLUG",
        },
        { status: 400 }
      );
    }

    // 2. Card ID validation
    if (!card_id || !isValidUuid(card_id)) {
      return NextResponse.json(
        { success: false, error: "INVALID_CARD_ID" },
        { status: 400 }
      );
    }

    // 3. Visitor identity extraction & dual-hash derivation
    const cookieStore = await cookies();
    const sbVid = cookieStore.get(SB_VID_COOKIE_NAME)?.value;
    const { currentHash, previousHash } = computeVisitorHashes(sbVid);

    // 4. Invoke atomic stored procedure record_card_reveal via service_role
    const { data, error: rpcError } = await adminClient.rpc("record_card_reveal", {
      p_card_id: card_id,
      p_view_receipt_id: view_receipt_id,
      p_visitor_id_hash: currentHash,
      p_previous_visitor_id_hash: previousHash,
    });

    if (rpcError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[api/telemetry/reveal] record_card_reveal error:",
          rpcError.message
        );
      }

      // If receipt error occurred and slug is available, attempt safe fallback reveal increment
      if (slug) {
        const headersList = await headers();
        const visitorHash = computeVisitorHash(headersList);
        await recordCardTelemetry(slug, "reveal", visitorHash, adminClient);
      }

      return NextResponse.json(
        {
          success: false,
          error: rpcError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        verified: true,
        status: data?.status || "verified",
        fast_scratch: Boolean(data?.fast_scratch),
        elapsed_ms: data?.elapsed_ms ?? null,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/telemetry/reveal] Unhandled exception:", err);
    }
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

