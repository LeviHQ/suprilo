"use client";

import * as React from "react";
import { Sparkles, Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface Testimonial {
  id: string;
  name: string;
  avatarChar: string;
  avatarBg: string;
  avatarText: string;
  avatarEmoji?: string;
  occasion: string;
  occasionColor: string;
  quote: string;
  hasHeart?: boolean;
}

const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: "t1",
    name: "Sofia M.",
    avatarChar: "S",
    avatarBg: "bg-rose-100",
    avatarText: "text-rose-700",
    avatarEmoji: "🌸",
    occasion: "Birthday Surprise",
    occasionColor: "bg-brand-pink-light text-brand-pink border-brand-pink-subtle",
    quote: "Sent a digital scratch card for my best friend’s 30th. She called me laughing before she even finished scratching the message!",
    hasHeart: true,
  },
  {
    id: "t2",
    name: "Liam K.",
    avatarChar: "L",
    avatarBg: "bg-purple-100",
    avatarText: "text-purple-700",
    avatarEmoji: "✨",
    occasion: "Anniversary",
    occasionColor: "bg-brand-purple-light text-brand-purple border-[#DDD6FE]",
    quote: "Hid our favorite photo from our first trip under the foil. Simple idea, but it made our quiet morning so memorable.",
    hasHeart: true,
  },
  {
    id: "t3",
    name: "Aarav P.",
    avatarChar: "A",
    avatarBg: "bg-emerald-100",
    avatarText: "text-emerald-700",
    avatarEmoji: "🚀",
    occasion: "Good News",
    occasionColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    quote: "Used this to tell my brother I finally got the job offer. He said scratching it off felt way cooler than a plain text.",
  },
  {
    id: "t4",
    name: "Elena R.",
    avatarChar: "E",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-700",
    avatarEmoji: "☀️",
    occasion: "Just Because",
    occasionColor: "bg-brand-orange-light text-[#D97706] border-[#FED7AA]",
    quote: "Sent a midday pick-me-up card to my mom while she was having a stressful week. She texted back with happy tears.",
    hasHeart: true,
  },
  {
    id: "t5",
    name: "Chloe T.",
    avatarChar: "C",
    avatarBg: "bg-yellow-100",
    avatarText: "text-yellow-800",
    avatarEmoji: "🎈",
    occasion: "Friendship",
    occasionColor: "bg-brand-yellow-light text-[#B45309] border-[#FDE68A]",
    quote: "An inside joke hidden behind golden scratch foil was the highlight of our group chat. Everyone wanted one next.",
  },
  {
    id: "t6",
    name: "Marcus B.",
    avatarChar: "M",
    avatarBg: "bg-sky-100",
    avatarText: "text-sky-700",
    avatarEmoji: "☕",
    occasion: "Everyday Kindness",
    occasionColor: "bg-sky-50 text-sky-700 border-sky-200",
    quote: "Thanked a colleague who helped me finish a huge presentation on short notice. Really appreciated how personal it felt.",
    hasHeart: true,
  },
  {
    id: "t7",
    name: "Hana Y.",
    avatarChar: "H",
    avatarBg: "bg-pink-100",
    avatarText: "text-pink-700",
    avatarEmoji: "🍰",
    occasion: "Birthday Surprise",
    occasionColor: "bg-brand-pink-light text-brand-pink border-brand-pink-subtle",
    quote: "Sent one to my cousin across the country for her 18th. The instant link made distance feel totally irrelevant.",
  },
  {
    id: "t8",
    name: "Devon S.",
    avatarChar: "D",
    avatarBg: "bg-indigo-100",
    avatarText: "text-indigo-700",
    avatarEmoji: "🎓",
    occasion: "Milestone",
    occasionColor: "bg-brand-purple-light text-brand-purple border-[#DDD6FE]",
    quote: "Celebrated my partner’s graduation milestone with a customized message. The interactive reveal is genuinely fun.",
    hasHeart: true,
  },
  {
    id: "t9",
    name: "Zara N.",
    avatarChar: "Z",
    avatarBg: "bg-rose-100",
    avatarText: "text-rose-700",
    avatarEmoji: "💌",
    occasion: "Long Distance",
    occasionColor: "bg-rose-50 text-rose-700 border-rose-200",
    quote: "We’re in different time zones right now. Waking up to a card she made made the whole week better.",
    hasHeart: true,
  },
  {
    id: "t10",
    name: "Lucas G.",
    avatarChar: "L",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-800",
    avatarEmoji: "🍕",
    occasion: "Friendship",
    occasionColor: "bg-brand-yellow-light text-[#B45309] border-[#FDE68A]",
    quote: "My roommate loved scratching to find out which restaurant we were heading to for our weekend tradition.",
  },
  {
    id: "t11",
    name: "Maya D.",
    avatarChar: "M",
    avatarBg: "bg-teal-100",
    avatarText: "text-teal-700",
    avatarEmoji: "🌻",
    occasion: "Just Because",
    occasionColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    quote: "Dropped a sweet reminder for my sister before her driving exam. The reveal gave her that extra little boost of confidence.",
    hasHeart: true,
  },
  {
    id: "t12",
    name: "Mateo C.",
    avatarChar: "M",
    avatarBg: "bg-pink-100",
    avatarText: "text-pink-700",
    avatarEmoji: "❤️",
    occasion: "Anniversary",
    occasionColor: "bg-brand-pink-light text-brand-pink border-brand-pink-subtle",
    quote: "Ten years together and it’s still fun finding creative ways to say ‘I still adore you.’ Loved the cover styling.",
    hasHeart: true,
  },
  {
    id: "t13",
    name: "Nora F.",
    avatarChar: "N",
    avatarBg: "bg-blue-100",
    avatarText: "text-blue-700",
    avatarEmoji: "🌿",
    occasion: "Everyday Kindness",
    occasionColor: "bg-sky-50 text-sky-700 border-sky-200",
    quote: "Sent a note thanking our neighbor for watching our plants. Such a warm, thoughtful alternative to an email.",
  },
  {
    id: "t14",
    name: "Julian W.",
    avatarChar: "J",
    avatarBg: "bg-orange-100",
    avatarText: "text-orange-700",
    avatarEmoji: "🎉",
    occasion: "Good News",
    occasionColor: "bg-brand-orange-light text-[#D97706] border-[#FED7AA]",
    quote: "Announced our weekend getaway destination to the family through a scratch card. The anticipation was priceless!",
    hasHeart: true,
  },
  {
    id: "t15",
    name: "Priya K.",
    avatarChar: "P",
    avatarBg: "bg-purple-100",
    avatarText: "text-purple-700",
    avatarEmoji: "✨",
    occasion: "Birthday Surprise",
    occasionColor: "bg-brand-purple-light text-brand-purple border-[#DDD6FE]",
    quote: "Quick to make, beautifully smooth on mobile, and brought a huge genuine smile. Exactly what greetings should be.",
  },
];

// Row 2 uses a rotated sequence for visual offset variety
const ROW2_DATA: Testimonial[] = [
  ...TESTIMONIALS_DATA.slice(7),
  ...TESTIMONIALS_DATA.slice(0, 7),
];

interface TestimonialCardProps {
  item: Testimonial;
}

function TestimonialCard({ item }: TestimonialCardProps) {
  return (
    <div className="w-[230px] sm:w-[260px] md:w-[280px] shrink-0 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-brand-warm-border shadow-card hover:shadow-card-hover hover:border-brand-pink/30 transition-all duration-200 flex flex-col justify-between select-none">
      {/* Card Header: Avatar, Name, Occasion Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div
            className={`w-8 h-8 sm:w-9 h-9 rounded-full ${item.avatarBg} ${item.avatarText} flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white select-none shrink-0`}
            aria-hidden="true"
          >
            {item.avatarEmoji ? (
              <span className="text-sm sm:text-base leading-none">{item.avatarEmoji}</span>
            ) : (
              item.avatarChar
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-brand-dark leading-tight truncate">
              {item.name}
            </h4>
            <span
              className={`inline-block text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${item.occasionColor}`}
            >
              {item.occasion}
            </span>
          </div>
        </div>

        {item.hasHeart ? (
          <Heart className="w-3.5 h-3.5 text-brand-pink fill-brand-pink/20 shrink-0" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-brand-orange shrink-0" />
        )}
      </div>

      {/* Quote */}
      <p className="text-[11px] sm:text-xs text-brand-muted leading-relaxed italic font-normal">
        &ldquo;{item.quote}&rdquo;
      </p>
    </div>
  );
}

export function TestimonialsMarquee() {
  return (
    <section
      id="testimonials"
      className="py-16 md:py-24 relative overflow-hidden overflow-x-clip bg-brand-warm-subtle/40 w-full max-w-full"
      style={{ contain: "paint" }}
      aria-label="Stories and demo feedback"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12 text-center">
        {/* Eyebrow / Disclaimer badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-4">
          <Badge variant="purple">Stories & Inspiration</Badge>
          <span className="text-[11px] font-medium text-brand-muted bg-white px-2.5 py-0.5 rounded-full border border-brand-warm-border">
            Illustrative demo feedback — fictional personas
          </span>
        </div>

        {/* Section Headings */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
          Little notes. Big feelings.
        </h2>
        <p className="text-base sm:text-lg text-brand-muted mt-2">
          Small surprises, lovely moments.
        </p>
      </div>

      {/* Marquee Container with edge fade masks */}
      <div
        className="relative w-full max-w-full overflow-hidden overflow-x-clip marquee-pause-hover"
        style={{ contain: "paint" }}
      >
        {/* Left & Right gradient edge fades */}
        <div
          className="absolute top-0 bottom-0 left-0 w-8 sm:w-20 md:w-36 bg-gradient-to-r from-[#FBF9F6] to-transparent z-10 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-8 sm:w-20 md:w-36 bg-gradient-to-l from-[#FBF9F6] to-transparent z-10 pointer-events-none"
          aria-hidden="true"
        />

        <div className="space-y-3.5 sm:space-y-5">
          {/* ROW 1: Moves Left to Right */}
          <div className="w-full max-w-full overflow-hidden overflow-x-clip" style={{ contain: "paint" }}>
            <div className="flex gap-3 sm:gap-4.5 w-max animate-marquee-ltr select-none">
              {/* Primary Sequence (Accessible) */}
              <div className="flex gap-3 sm:gap-4.5">
                {TESTIMONIALS_DATA.map((item) => (
                  <TestimonialCard key={`r1-primary-${item.id}`} item={item} />
                ))}
              </div>

              {/* Duplicated Sequence (Aria Hidden for infinite seamless loop) */}
              <div
                className="flex gap-3 sm:gap-4.5"
                aria-hidden="true"
              >
                {TESTIMONIALS_DATA.map((item) => (
                  <TestimonialCard key={`r1-duplicate-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* ROW 2: Moves Right to Left */}
          <div className="w-full max-w-full overflow-hidden overflow-x-clip" style={{ contain: "paint" }}>
            <div className="flex gap-3 sm:gap-4.5 w-max animate-marquee-rtl select-none">
              {/* Primary Sequence (Accessible) */}
              <div className="flex gap-3 sm:gap-4.5">
                {ROW2_DATA.map((item) => (
                  <TestimonialCard key={`r2-primary-${item.id}`} item={item} />
                ))}
              </div>

              {/* Duplicated Sequence (Aria Hidden for infinite seamless loop) */}
              <div
                className="flex gap-3 sm:gap-4.5"
                aria-hidden="true"
              >
                {ROW2_DATA.map((item) => (
                  <TestimonialCard key={`r2-duplicate-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
