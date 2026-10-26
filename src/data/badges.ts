export type BadgeCategory = "getting-started" | "creator" | "sharing" | "milestones";
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string; // Lucide icon identifier
  unlockCondition: string;
  locked: boolean;
  points: number;
}

export const BADGE_CATEGORIES: { id: BadgeCategory; label: string; count: number }[] = [
  { id: "getting-started", label: "Getting Started", count: 6 },
  { id: "creator", label: "Creator", count: 8 },
  { id: "sharing", label: "Sharing & Impact", count: 8 },
  { id: "milestones", label: "Milestones", count: 8 },
];

/**
 * Exactly 30 distinct badge definitions organized into 4 categories:
 * - Getting Started: 6 badges
 * - Creator: 8 badges
 * - Sharing & Impact: 8 badges
 * - Milestones: 8 badges
 * Total = 30 badges
 */
export const SU_PRILO_BADGES: BadgeDefinition[] = [
  // ==========================================
  // CATEGORY 1: Getting Started (6 Badges)
  // ==========================================
  {
    id: "gs-first-step",
    name: "First Impression",
    description: "Welcome to Suprilo! Created your account and set up your creator profile.",
    category: "getting-started",
    rarity: "common",
    icon: "Sparkles",
    unlockCondition: "Complete account sign-in with Google.",
    locked: false, // Default unlocked for logged-in user as a warm welcome
    points: 10,
  },
  {
    id: "gs-scratch-tester",
    name: "Curious Finger",
    description: "Interacted with the interactive scratch demo on the Suprilo landing page.",
    category: "getting-started",
    rarity: "common",
    icon: "HandMetal",
    unlockCondition: "Scratch at least 50% of the demo card on the homepage.",
    locked: true,
    points: 15,
  },
  {
    id: "gs-first-card",
    name: "The Spark",
    description: "Crafted your very first personalized surprise scratch card in the Studio.",
    category: "getting-started",
    rarity: "common",
    icon: "PenTool",
    unlockCondition: "Publish or preview your first customized scratch card.",
    locked: true,
    points: 25,
  },
  {
    id: "gs-profile-ready",
    name: "Name in Lights",
    description: "Personalized your display name and creator settings in Account Settings.",
    category: "getting-started",
    rarity: "common",
    icon: "UserCheck",
    unlockCondition: "Update your creator display name in profile settings.",
    locked: true,
    points: 20,
  },
  {
    id: "gs-sound-on",
    name: "Sonic Delight",
    description: "Enabled scratch sound effects or ambient audio in your card preview.",
    category: "getting-started",
    rarity: "common",
    icon: "Volume2",
    unlockCondition: "Create a card with custom sound effects enabled.",
    locked: true,
    points: 15,
  },
  {
    id: "gs-explorer",
    name: "Control Center Tour",
    description: "Explored every section of your Suprilo User Control Center.",
    category: "getting-started",
    rarity: "rare",
    icon: "Compass",
    unlockCondition: "Visit Home, Analytics, Badges, Billing, Redeem, and Settings.",
    locked: true,
    points: 30,
  },

  // ==========================================
  // CATEGORY 2: Creator (8 Badges)
  // ==========================================
  {
    id: "cr-palette-master",
    name: "Color Alchemist",
    description: "Experimented with multiple card themes and custom gradient foil colors.",
    category: "creator",
    rarity: "common",
    icon: "Palette",
    unlockCondition: "Use 5 different theme colors across your created cards.",
    locked: true,
    points: 35,
  },
  {
    id: "cr-photo-memory",
    name: "Picture Perfect",
    description: "Created a heartfelt card featuring a personalized hidden photo memory.",
    category: "creator",
    rarity: "rare",
    icon: "Image",
    unlockCondition: "Add a custom photo under the scratchable surface.",
    locked: true,
    points: 40,
  },
  {
    id: "cr-secret-vault",
    name: "Vault of Secrets",
    description: "Crafted a card containing a special gift voucher, code, or reveal prize.",
    category: "creator",
    rarity: "rare",
    icon: "KeyRound",
    unlockCondition: "Create a card with coupon/secret gift reveal mode enabled.",
    locked: true,
    points: 45,
  },
  {
    id: "cr-love-letter",
    name: "Romantic Wordsmith",
    description: "Penned an intimate message that brought tears or smiles of joy.",
    category: "creator",
    rarity: "rare",
    icon: "Heart",
    unlockCondition: "Write a message exceeding 100 heartfelt words in a card.",
    locked: true,
    points: 50,
  },
  {
    id: "cr-foil-artisan",
    name: "Gold Leaf Artisan",
    description: "Selected a premium metallic gold or holographic scratch overlay.",
    category: "creator",
    rarity: "rare",
    icon: "Gem",
    unlockCondition: "Apply a metallic gold foil overlay texture to any card.",
    locked: true,
    points: 45,
  },
  {
    id: "cr-music-maestro",
    name: "Serenade",
    description: "Synchronized a surprise reveal with a romantic or celebratory background tune.",
    category: "creator",
    rarity: "epic",
    icon: "Music",
    unlockCondition: "Attach a custom soundtrack to a surprise card.",
    locked: true,
    points: 60,
  },
  {
    id: "cr-confetti-blaster",
    name: "Celebration King",
    description: "Created a card with custom confetti cannons upon scratch completion.",
    category: "creator",
    rarity: "common",
    icon: "PartyPopper",
    unlockCondition: "Enable high-density celebration confetti in Studio.",
    locked: true,
    points: 30,
  },
  {
    id: "cr-perfectionist",
    name: "Master Crafter",
    description: "Designed 10 unique surprise cards across different occasions.",
    category: "creator",
    rarity: "epic",
    icon: "Crown",
    unlockCondition: "Publish 10 cards with distinct recipient names.",
    locked: true,
    points: 100,
  },

  // ==========================================
  // CATEGORY 3: Sharing & Impact (8 Badges)
  // ==========================================
  {
    id: "sh-first-share",
    name: "Gift of Joy",
    description: "Shared your first Suprilo link with someone you care about.",
    category: "sharing",
    rarity: "common",
    icon: "Share2",
    unlockCondition: "Copy and share a card link via WhatsApp, SMS, or Email.",
    locked: true,
    points: 25,
  },
  {
    id: "sh-first-reveal",
    name: "The Reveal",
    description: "Your recipient opened and scratched off their first surprise card.",
    category: "sharing",
    rarity: "rare",
    icon: "Eye",
    unlockCondition: "Receive your first verified 100% scratch reveal from a recipient.",
    locked: true,
    points: 50,
  },
  {
    id: "sh-clean-sweep",
    name: "Clean Sweep",
    description: "A recipient scratched 100% of the surface without leaving a single pixel.",
    category: "sharing",
    rarity: "rare",
    icon: "CheckCheck",
    unlockCondition: "Recipient achieves 98%+ surface clear on your card.",
    locked: true,
    points: 40,
  },
  {
    id: "sh-reaction-champion",
    name: "Tears of Joy",
    description: "Recipient recorded a reaction video or sent a thank-you note.",
    category: "sharing",
    rarity: "epic",
    icon: "SmilePlus",
    unlockCondition: "Receive a verified love note reply from a card recipient.",
    locked: true,
    points: 75,
  },
  {
    id: "sh-viral-moment",
    name: "Crowd Pleaser",
    description: "A single surprise card viewed by more than 20 unique visitors.",
    category: "sharing",
    rarity: "epic",
    icon: "Flame",
    unlockCondition: "Reach 20 unique views on any shared card.",
    locked: true,
    points: 80,
  },
  {
    id: "sh-speed-scratcher",
    name: "Lightning Reveal",
    description: "A recipient revealed the hidden message within 10 seconds of opening.",
    category: "sharing",
    rarity: "common",
    icon: "Zap",
    unlockCondition: "Recipient scratches past the reveal threshold in under 10 seconds.",
    locked: true,
    points: 30,
  },
  {
    id: "sh-midnight-surprise",
    name: "Midnight Magic",
    description: "A surprise card opened right at midnight for an anniversary or birthday.",
    category: "sharing",
    rarity: "rare",
    icon: "Moon",
    unlockCondition: "A card is scratched between 11:55 PM and 12:05 AM.",
    locked: true,
    points: 60,
  },
  {
    id: "sh-global-connector",
    name: "Across the Oceans",
    description: "Your card was opened and revealed in a country different from yours.",
    category: "sharing",
    rarity: "legendary",
    icon: "Globe",
    unlockCondition: "Recipient reveals a card from an international timezone.",
    locked: true,
    points: 120,
  },

  // ==========================================
  // CATEGORY 4: Milestones (8 Badges)
  // ==========================================
  {
    id: "ms-five-cards",
    name: "Memory Keeper",
    description: "Crafted 5 heartfelt surprise cards for loved ones.",
    category: "milestones",
    rarity: "common",
    icon: "Layers",
    unlockCondition: "Create and publish a total of 5 surprise cards.",
    locked: true,
    points: 50,
  },
  {
    id: "ms-twenty-five-cards",
    name: "Surprise Maestro",
    description: "Created 25 unique surprise moments with Suprilo.",
    category: "milestones",
    rarity: "rare",
    icon: "Sparkle",
    unlockCondition: "Reach 25 total cards created on your account.",
    locked: true,
    points: 100,
  },
  {
    id: "ms-hundred-reveals",
    name: "Century of Joy",
    description: "100 total surprise reveals completed across all your cards.",
    category: "milestones",
    rarity: "epic",
    icon: "Trophy",
    unlockCondition: "Accumulate 100 total verified reveals across all links.",
    locked: true,
    points: 200,
  },
  {
    id: "ms-one-year-club",
    name: "Loyal Romantic",
    description: "Active member of Suprilo for over 365 days of memorable moments.",
    category: "milestones",
    rarity: "legendary",
    icon: "ShieldAlert",
    unlockCondition: "Account active for 1 year since first registration.",
    locked: true,
    points: 250,
  },
  {
    id: "ms-holiday-hero",
    name: "Holiday Hero",
    description: "Shared surprise cards on 3 major holidays (Valentine's, New Year, Christmas).",
    category: "milestones",
    rarity: "rare",
    icon: "CalendarCheck",
    unlockCondition: "Send cards during 3 distinct calendar holiday seasons.",
    locked: true,
    points: 75,
  },
  {
    id: "ms-community-advocate",
    name: "Ambassador of Surprises",
    description: "Referred 5 friends who created their first Suprilo surprise card.",
    category: "milestones",
    rarity: "legendary",
    icon: "Medal",
    unlockCondition: "5 friends sign up and create a card using your referral code.",
    locked: true,
    points: 300,
  },
  {
    id: "ms-secret-supporter",
    name: "Guardian Angel",
    description: "Sent an anonymous surprise card that warmed someone's heart.",
    category: "milestones",
    rarity: "rare",
    icon: "ShieldCheck",
    unlockCondition: "Send a card with anonymous sender mode activated.",
    locked: true,
    points: 50,
  },
  {
    id: "ms-legendary-curator",
    name: "Grand Illusionist",
    description: "Attained top creator standing with 500+ total card reveals.",
    category: "milestones",
    rarity: "legendary",
    icon: "Award",
    unlockCondition: "Reach 500 total recipient reveals across your cards.",
    locked: true,
    points: 500,
  },
];

export function getBadgesByCategory(category?: BadgeCategory | "all"): BadgeDefinition[] {
  if (!category || category === "all") {
    return SU_PRILO_BADGES;
  }
  return SU_PRILO_BADGES.filter((b) => b.category === category);
}

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return SU_PRILO_BADGES.find((b) => b.id === id);
}

export function getRarityColor(rarity: BadgeRarity): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconColor: string;
} {
  switch (rarity) {
    case "common":
      return {
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700",
        badgeBorder: "border-slate-200",
        iconBg: "bg-slate-100",
        iconColor: "text-slate-600",
      };
    case "rare":
      return {
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-700",
        badgeBorder: "border-blue-200",
        iconBg: "bg-blue-100/70",
        iconColor: "text-blue-600",
      };
    case "epic":
      return {
        badgeBg: "bg-purple-50",
        badgeText: "text-purple-700",
        badgeBorder: "border-purple-200",
        iconBg: "bg-purple-100/70",
        iconColor: "text-purple-600",
      };
    case "legendary":
      return {
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-800",
        badgeBorder: "border-amber-300",
        iconBg: "bg-gradient-to-br from-amber-100 to-yellow-200",
        iconColor: "text-amber-700",
      };
  }
}
