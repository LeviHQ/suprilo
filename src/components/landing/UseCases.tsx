import * as React from "react";
import { Cake, HeartHandshake, Sparkles, Trophy, Smile } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function UseCases() {
  const cases = [
    {
      category: "Birthday Surprises",
      icon: Cake,
      headline: "The birthday card they won't forget",
      sampleMessage: "“Pack your bags, we’re going to Lisbon this weekend! Happy Birthday!”",
      tagColor: "bg-brand-pink-light text-brand-pink border-brand-pink-subtle",
      foilAccent: "from-brand-pink to-brand-orange",
    },
    {
      category: "Anniversaries & Romance",
      icon: HeartHandshake,
      headline: "Little reminders of big love",
      sampleMessage: "“3 years together today. Dinner reservation is booked for 8 PM at our spot.”",
      tagColor: "bg-rose-50 text-rose-600 border-rose-200",
      foilAccent: "from-rose-500 to-brand-pink",
    },
    {
      category: "Friendship Appreciation",
      icon: Smile,
      headline: "Celebrate your favorite people",
      sampleMessage: "“Thank you for always answering my late night calls. Coffee’s on me today!”",
      tagColor: "bg-brand-yellow-light text-[#D97706] border-[#FDE68A]",
      foilAccent: "from-brand-yellow to-brand-orange",
    },
    {
      category: "Good News & Milestones",
      icon: Trophy,
      headline: "Share exciting life announcements",
      sampleMessage: "“You passed the exam with flying colors! So endlessly proud of you!”",
      tagColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
      foilAccent: "from-emerald-400 to-teal-500",
    },
    {
      category: "Just-Because Moments",
      icon: Sparkles,
      headline: "Brighten someone's random Tuesday",
      sampleMessage: "“Just thinking of you today. Check your front porch for a little treat.”",
      tagColor: "bg-brand-purple-light text-brand-purple border-[#DDD6FE]",
      foilAccent: "from-brand-purple to-indigo-500",
    },
  ];

  return (
    <section id="use-cases" className="py-16 md:py-24 bg-brand-warm-subtle/50 relative overflow-hidden overflow-x-clip w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <Badge variant="purple">Endless Possibilities</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Every Moment Worth Celebrating
          </h2>
          <p className="text-base sm:text-lg text-brand-muted">
            From milestones to spontaneous midday smiles, Suprilo brings magic to any occasion.
          </p>
        </div>

        {/* Use Cases Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {cases.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.category}
                className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${item.tagColor}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-brand-dark">
                    {item.headline}
                  </h3>

                  {/* Stylized Preview Snippet */}
                  <div className="p-4 rounded-2xl bg-brand-warm-subtle/80 border border-brand-warm-border text-xs text-brand-muted italic leading-relaxed relative">
                    <div className="absolute top-2 right-3 text-2xl font-serif text-brand-warm-border select-none pointer-events-none">
                      &rdquo;
                    </div>
                    {item.sampleMessage}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-brand-warm-border/50 flex items-center justify-between text-xs text-brand-muted">
                  <span className="font-medium">Scratch reveal effect</span>
                  <div className={`h-2 w-12 rounded-full bg-gradient-to-r ${item.foilAccent}`} />
                </div>
              </div>
            );
          })}

          {/* Inspiration card */}
          <div className="bg-gradient-to-br from-brand-pink-light via-brand-orange-light to-brand-purple-light rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-pink">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-brand-dark">
                Your Own Custom Surprise
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Have a secret proposal, gender reveal, game night clue, or sweet gratitude note? Suprilo is your blank canvas for joy.
              </p>
            </div>
            <div className="pt-4 text-xs font-semibold text-brand-pink">
              Coming in Phase 2
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
