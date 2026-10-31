import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root Next.js Middleware
 * Runs before all matched routes to keep Supabase authentication cookies fresh.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const matcher = [
  /*
   * Match all request paths except for:
   * - _next/static (static asset files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon)
   * - brand assets and static images (*.png, *.jpg, *.svg, etc.)
   */
  "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
];

