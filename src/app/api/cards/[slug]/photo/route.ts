import { NextResponse } from "next/server";
import { handleCardPhotoProxy } from "@/lib/server/card-recipient";

export const dynamic = "force-dynamic";

/**
 * Server-Side Recipient Photo Proxy Endpoint
 * GET /api/cards/[slug]/photo
 *
 * Streams private card photos directly to authorized recipients without exposing
 * internal Storage paths, owner user UUIDs, or signed Storage URLs to the browser.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    return await handleCardPhotoProxy(request, slug);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/cards/[slug]/photo] Photo proxy exception:", err);
    }
    return new NextResponse(null, { status: 503 });
  }
}
