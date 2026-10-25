import * as React from "react";
import {
  MessageSquareHeart,
  Camera,
  Sparkles,
  Link2,
  Smartphone,
  PartyPopper,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function Features() {
  const features = [
    {
      title: "Personal messages",
      description:
        "Express exactly what's on your mind. From heartfelt love letters to goofy inside jokes, make your words the ultimate reveal.",
      icon: MessageSquareHeart,
      color: "bg-brand-pink-light text-brand-pink border-brand-pink-subtle",
    },
    {
      title: "Photo-based surprises",
      description:
        "Hide a favorite memory, travel snapshot, or secret photo under the foil for a nostalgic, unforgettable smile.",
      icon: Camera,
      color: "bg-brand-orange-light text-brand-orange border-[#FED7AA]",
    },
    {
      title: "Interactive scratch-to-reveal",
      description:
        "Feel the anticipation. Swiping, scratching, and peeling away the foil creates that joyful rush of real-world scratch-offs.",
      icon: Sparkles,
      color: "bg-brand-purple-light text-brand-purple border-[#DDD6FE]",
    },
    {
      title: "Easy sharing through a link",
      description:
        "Generate a private link that you can text on WhatsApp, iMessage, Messenger, or email in seconds.",
      icon: Link2,
      color: "bg-brand-yellow-light text-[#D97706] border-[#FDE68A]",
    },
    {
      title: "Mobile-friendly recipient experience",
      description:
        "Your recipient doesn't need an account or app download. One tap on mobile and the scratching excitement begins immediately.",
      icon: Smartphone,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      title: "Every celebration covered",
      description:
        "Birthdays, anniversaries, promotions, graduations, or just reminding someone they matter—every day has a reason to celebrate.",
      icon: PartyPopper,
      color: "bg-rose-50 text-rose-600 border-rose-200",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 relative overflow-hidden overflow-x-clip w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <Badge variant="orange">Crafted for Connection</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Designed for Genuine Smiles
          </h2>
          <p className="text-base sm:text-lg text-brand-muted">
            Everything you need to turn simple greetings into tangible emotional moments people remember.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${feature.color} group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-pink transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-brand-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
