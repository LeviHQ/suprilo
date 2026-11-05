import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Validates and sanitizes redirect destination to prevent Open Redirect attacks.
 * Only allows relative paths on the same origin (e.g., "/create", "/templates").
 * Blocks protocol-relative paths ("//evil.com") and external URLs ("https://...").
 */
function sanitizeRedirectDestination(nextParam: string | null, origin: string): string {
  if (!nextParam) {
    return `${origin}/`;
  }

  // Must start with a single forward slash and not contain protocol schemes or backslashes
  if (
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\") &&
    !nextParam.includes("://")
  ) {
    return `${origin}${nextParam}`;
  }

  // Fallback to application root if an unsafe or malformed path is detected
  return `${origin}/`;
}

/**
 * Renders an automated bridge response for popup-based OAuth authentications.
 * Broadcasts the completion payload to the opener window and closes the popup,
 * preventing Google authentication URLs from polluting the main window history stack.
 */
function renderPopupResponse(payload: {
  success: boolean;
  destination: string;
  error?: string;
}): NextResponse {
  const jsonPayload = JSON.stringify(payload);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Suprilo Authentication</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #faf8f5;
      color: #1e1b18;
      text-align: center;
      padding: 20px;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(236, 72, 153, 0.2);
      border-top-color: #ec4899;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 14px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    p { font-size: 13px; color: #6b7280; margin: 0; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Completing secure sign-in...</p>
  <script>
    (function() {
      var payload = ${jsonPayload};
      var origin = window.location.origin;

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          var channel = new BroadcastChannel('suprilo_auth_channel');
          channel.postMessage(payload);
          channel.close();
        }
      } catch (_) {}

      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(payload, origin);
        } catch (_) {}
      }

      setTimeout(function() {
        window.close();
      }, 250);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

/**
 * OAuth PKCE Callback Route Handler
 * GET /auth/callback
 *
 * Receives the authorization code from Supabase Auth after Google sign-in,
 * exchanges it for a secure HttpOnly session, and redirects to the intended destination.
 * Supports both popup window completions and full-page redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const isPopup = searchParams.get("popup") === "true";

  const destination = sanitizeRedirectDestination(next, origin);

  // If no authorization code is present in the callback, return to home with generic error
  if (!code) {
    if (isPopup) {
      return renderPopupResponse({
        success: false,
        error: "missing_code",
        destination: `${origin}/?auth_error=missing_code`,
      });
    }
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      if (isPopup) {
        return renderPopupResponse({
          success: false,
          error: "exchange_failed",
          destination: `${origin}/?auth_error=exchange_failed`,
        });
      }
      // Redirection with generic flag, never exposing error details or credentials in query
      return NextResponse.redirect(`${origin}/?auth_error=exchange_failed`, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    if (isPopup) {
      return renderPopupResponse({
        success: true,
        destination,
      });
    }

    // Successfully exchanged session; redirect to verified internal destination
    return NextResponse.redirect(destination, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    if (isPopup) {
      return renderPopupResponse({
        success: false,
        error: "service_unavailable",
        destination: `${origin}/?auth_error=service_unavailable`,
      });
    }
    return NextResponse.redirect(`${origin}/?auth_error=service_unavailable`, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }
}

