import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_TARGET_TYPES = new Set(["card", "badge"]);
const ALLOWED_ACTION_TYPES = new Set([
  "link_copied",
  "native_share_opened",
  "story_card_downloaded",
]);

/**
 * Creator Share Event Telemetry Endpoint
 * POST /api/telemetry/share
 *
 * Implements SPEC-2C-5.6.1-FINAL v3.0.0 Section 8:
 * Records creator sharing events, acquires transactional advisory lock,
 * enforces 5-minute deduplication window, advances pending_generation,
 * and triggers synchronous achievement evaluation.
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

    const { target_type, target_id, action_type } = body as {
      target_type?: string;
      target_id?: string;
      action_type?: string;
    };

    if (
      !target_type ||
      !target_id ||
      !action_type ||
      !ALLOWED_TARGET_TYPES.has(target_type) ||
      !ALLOWED_ACTION_TYPES.has(action_type)
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_PARAMETERS" },
        { status: 400 }
      );
    }

    const authClient = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { data, error: rpcError } = await authClient.rpc(
      "record_creator_share_event",
      {
        p_target_type: target_type,
        p_target_id: target_id.trim(),
        p_action_type: action_type,
      }
    );

    if (rpcError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[api/telemetry/share] record_creator_share_event error:",
          rpcError.message
        );
      }
      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: Boolean(data?.success),
        deduplicated: Boolean(data?.deduplicated),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/telemetry/share] Unhandled exception:", err);
    }
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

