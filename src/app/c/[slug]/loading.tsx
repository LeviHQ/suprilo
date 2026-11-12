import { Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function RecipientCardLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-warm selection:bg-brand-pink/15 selection:text-brand-pink">
      {/* Brand Header */}
      <header className="w-full max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
        <BrandLogo href="/" size="sm" priority />
      </header>

      {/* Main Skeleton Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8">
        <div className="w-full max-w-lg mx-auto flex flex-col items-center animate-pulse">
          {/* Skeleton Pill */}
          <div className="h-7 w-48 bg-white/70 rounded-full mb-4 border border-brand-warm-border/50" />

          {/* Skeleton Card */}
          <div className="w-full aspect-[4/3] rounded-3xl bg-gradient-to-br from-brand-warm-subtle via-white to-brand-warm border border-brand-warm-border shadow-xl flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink/15 flex items-center justify-center text-brand-pink">
              <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div className="h-4 w-40 bg-brand-warm-border/70 rounded-full" />
            <div className="h-3 w-28 bg-brand-warm-border/50 rounded-full" />
          </div>

          {/* Skeleton Toolbar */}
          <div className="w-full mt-6 flex justify-between">
            <div className="h-8 w-24 bg-white/70 rounded-full border border-brand-warm-border/50" />
            <div className="h-8 w-24 bg-white/70 rounded-full border border-brand-warm-border/50" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-brand-muted">
        Loading your scratch card surprise...
      </footer>
    </div>
  );
}

