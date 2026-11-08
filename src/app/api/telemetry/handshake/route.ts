import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import {
  verifyHandshakeToken,
  computeVisitorHashes,
  isBotUserAgent,
  isValidUuid,
  SB_VID_COOKIE_NAME,
} from "@/lib/server/visitor-identity";

export const dynamic = "force-dynamic";

/**
 * Recipient Telemetry Handshake Endpoint
 * POST /api/telemetry/handshake
 *
 * Implements SPEC-2C-5.6.1-FINAL v3.0.0 Section 7.1:
 * 1. Cryptographically verifies HMAC handshake token, expiry (<= 300s), card binding, and session binding.
 * 2. Revalidates card existence, published status, bot User-Agent exclusion, and creator self-view.
 * 3. Derives dual-key visitor HMAC hashes from HttpOnly sb_vid cookie.
 * 4. Invokes public.record_card_view_handshake RPC atomically via service_role.
 * 5. Returns deterministic, idempotent view_receipt_id across retries.
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

    const { card_id, page_session_id, handshake_token } = body as {
      card_id?: string;
      page_session_id?: string;
      handshake_token?: string;
    };

    // 1. Parameter structure and UUID validation
    if (
      !card_id ||
      !page_session_id ||
      !handshake_token ||
      !isValidUuid(card_id) ||
      !isValidUuid(page_session_id)
    ) {
      return NextResponse.json(
        { success: false, error: "MISSING_OR_INVALID_PARAMETERS" },
        { status: 400 }
      );
    }

    // 2. Cryptographic token verification (HMAC signature, 300s TTL, card/session binding)
    const verification = verifyHandshakeToken(
      handshake_token,
      card_id,
      page_session_id
    );

    if (!verification.valid) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[api/telemetry/handshake] Token verification failed: ${verification.error}`
        );
      }
      return NextResponse.json(
        { success: false, error: verification.error || "INVALID_HANDSHAKE_TOKEN" },
        { status: 401 }
      );
    }

    // 3. Bot User-Agent detection & filtering
    const headersList = await headers();
    const userAgent = headersList.get("user-agent");
    if (isBotUserAgent(userAgent)) {
      return NextResponse.json(
        { success: true, is_bot: true, view_receipt_id: null },
        { status: 200 }
      );
    }

    // 4. Admin client resolution
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    // 5. Card existence & published state revalidation
    const { data: card, error: cardError } = await adminClient
      .from("cards")
      .select("id, user_id, status")
      .eq("id", card_id)
      .maybeSingle();

    if (cardError || !card || card.status !== "published") {
      return NextResponse.json(
        { success: false, error: "CARD_NOT_FOUND_OR_UNPUBLISHED" },
        { status: 404 }
      );
    }

    // 6. Creator self-view detection
    let isCreatorSelfView = false;
    try {
      const authClient = await createAuthClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (user && user.id === card.user_id) {
        isCreatorSelfView = true;
      }
    } catch {
      // Unauthenticated visitor is the expected standard case; ignore auth resolution errors
    }

    // 7. Visitor identity extraction & dual-hash derivation
    const cookieStore = await cookies();
    const sbVid = cookieStore.get(SB_VID_COOKIE_NAME)?.value;
    const { currentHash, previousHash, isUntracked } = computeVisitorHashes(sbVid);

    // 8. Atomic stored procedure execution (idempotent ON CONFLICT RETURNING)
    const { data, error: rpcError } = await adminClient.rpc(
      "record_card_view_handshake",
      {
        p_card_id: card.id,
        p_page_session_id: page_session_id,
        p_visitor_id_hash: currentHash,
        p_is_untracked: isUntracked,
        p_previous_visitor_id_hash: previousHash,
      }
    );

    if (rpcError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[api/telemetry/handshake] record_card_view_handshake error:",
          rpcError.message
        );
      }
      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: 500 }
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json(
      {
        success: true,
        creator_self_view: isCreatorSelfView,
        view_receipt_id: row?.view_receipt_id || null,
        is_untracked: Boolean(row?.is_untracked),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/telemetry/handshake] Unhandled exception:", err);
    }
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

