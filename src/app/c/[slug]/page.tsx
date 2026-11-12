import type { Metadata } from "next";
import Link from "next/link";
import crypto from "crypto";
import { Sparkles, HelpCircle, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { isValidCardSlug } from "@/lib/slug";
import { getPublishedCardBySlug, CardBackendError, toRecipientCardDto } from "@/lib/cards";
import { createHandshakeToken } from "@/lib/server/visitor-identity";
import { RecipientCardExperience } from "@/components/scratch/RecipientCardExperience";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates dynamic OpenGraph and document metadata for public recipient scratch cards.
 * Prevents search engine indexing to maintain recipient privacy.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!slug || !isValidCardSlug(slug)) {
    return {
      title: "Card Not Found | Suprilo",
      robots: { index: false, follow: false },
    };
  }

  try {
    const card = await getPublishedCardBySlug(slug);
    if (!card) {
      return {
        title: "Card Not Found | Suprilo",
        robots: { index: false, follow: false },
      };
    }

    const occasion = card.occasion_tag ? ` (${card.occasion_tag})` : "";
    return {
      title: `A surprise scratch card for ${card.recipient_name} | Suprilo`,
      description: `You've received a special scratch card${occasion} from ${card.sender_name}! Scratch to reveal your surprise message.`,
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: `A surprise scratch card for ${card.recipient_name} ✨`,
        description: `You've received a scratch card from ${card.sender_name}. Scratch to reveal your surprise!`,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Card Unavailable | Suprilo",
      robots: { index: false, follow: false },
    };
  }
}

/**
 * Friendly Not Found / Unavailable Card State UI (404 / Missing / Unpublished)
 */
function CardNotFoundState({ reason }: { reason: "invalid_slug" | "not_found" }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-warm selection:bg-brand-pink/15 selection:text-brand-pink">
      {/* Brand Header */}
      <header className="w-full max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
        <BrandLogo href="/" size="sm" priority />
        <Link href="/create">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create a Card</span>
          </Button>
        </Link>
      </header>

      {/* Main Not Found Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-brand-warm-border space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-sm">
            <HelpCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-extrabold text-brand-dark tracking-tight">
              Card Not Available
            </h1>
            <p className="text-sm text-brand-muted leading-relaxed">
              {reason === "invalid_slug"
                ? "This scratch card link appears to be malformed or incomplete. Please check the URL and try again."
                : "This scratch card might be expired, unpublished, or has been removed by its creator."}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full justify-center gap-2">
                <span>Create Your Own</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="secondary" size="md" className="w-full justify-center">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-brand-muted">
        © {new Date().getFullYear()} Suprilo. Make every moment a surprise.
      </footer>
    </div>
  );
}

/**
 * Temporary Backend / Database Service Error State UI (503 / Retryable)
 */
function CardBackendErrorState() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-warm selection:bg-brand-pink/15 selection:text-brand-pink">
      {/* Brand Header */}
      <header className="w-full max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
        <BrandLogo href="/" size="sm" priority />
      </header>

      {/* Main Error Viewport */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-brand-warm-border space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-extrabold text-brand-dark tracking-tight">
              Temporary Connection Issue
            </h1>
            <p className="text-sm text-brand-muted leading-relaxed">
              We couldn’t reach the card service right now. Please refresh this page or try again in a few moments.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="secondary" size="md" className="w-full justify-center">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-brand-muted">
        © {new Date().getFullYear()} Suprilo. Make every moment a surprise.
      </footer>
    </div>
  );
}

/**
 * Public Recipient Scratch Card Page
 * Route: /c/[slug]
 *
 * Adheres strictly to SPEC-2C-5.6.1-FINAL v3.0.0:
 * - Zero view receipts inserted during initial SSR request.
 * - Generates ephemeral pageSessionId and cryptographically signed handshakeToken.
 * - Passes credentials to client RecipientCardExperience for post-mount telemetry handshake.
 */
export default async function RecipientCardPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Validate slug constraint upfront
  if (!slug || !isValidCardSlug(slug)) {
    return <CardNotFoundState reason="invalid_slug" />;
  }

  // 2. Retrieve published card using restricted public RPC
  let card;
  try {
    card = await getPublishedCardBySlug(slug);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      const msg = err instanceof CardBackendError ? err.message : String(err);
      console.warn("[RecipientCardPage] Backend error loading card:", msg);
    }
    return <CardBackendErrorState />;
  }

  if (!card) {
    return <CardNotFoundState reason="not_found" />;
  }

  // 3. Cryptographically Authorized Handshake Preparation (SPEC-2C-5.6.1-FINAL Section 7.1)
  // Ephemeral page_session_id generated per server render; handshake_token signed with HMAC-SHA256 (300s TTL)
  const pageSessionId = crypto.randomUUID();
  let handshakeToken = "";
  try {
    handshakeToken = createHandshakeToken(card.id, pageSessionId);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[RecipientCardPage] Failed to generate handshake token:", err);
    }
  }

  // 4. Sanitize DTO for client component (strips card UUID, photo_path, has_photo, user_id, published_at)
  const clientDto = toRecipientCardDto(card);

  return (
    <div className="min-h-screen flex flex-col bg-brand-warm selection:bg-brand-pink/15 selection:text-brand-pink">
      {/* Brand Header */}
      <header className="w-full max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
        <BrandLogo href="/" size="sm" priority />

        <Link href="/create">
          <Button variant="outline" size="sm" className="gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send a Surprise</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </Link>
      </header>

      {/* Interactive Recipient Card Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8">
        <RecipientCardExperience
          card={clientDto}
          hasPhoto={Boolean(card.has_photo)}
          cardId={card.id}
          pageSessionId={pageSessionId}
          handshakeToken={handshakeToken}
        />
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-brand-muted">
        Powered by{" "}
        <Link href="/" className="font-semibold text-brand-dark hover:text-brand-pink transition-colors">
          Suprilo
        </Link>
        {" "}— Create interactive digital scratch cards in seconds.
      </footer>
    </div>
  );
}
