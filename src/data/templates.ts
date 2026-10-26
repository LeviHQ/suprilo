import { CoverStyle } from "@/components/scratch/ScratchCard";

export type TemplateCategory =
  | "birthday"
  | "love"
  | "friendship"
  | "anniversary"
  | "thank-you"
  | "congratulations"
  | "just-because";

export interface TemplateDefinition {
  id: string;
  title: string;
  category: TemplateCategory;
  categoryLabel: string;
  description: string;
  tag: string;
  recipient: string;
  sender: string;
  message: string;
  secondary: string;
  coverStyle: CoverStyle;
  coverText: string;
  bgGradient: string; // Tailwind gradient classes for card interior
  textColor: string;
  badgeColor: "pink" | "orange" | "purple" | "yellow" | "neutral";
  sticker: "heart" | "sparkles" | "cake" | "flower" | "gift" | "confetti" | "trophy" | "star";
  accentColor: string;
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "birthday", label: "Birthday" },
  { id: "love", label: "Love & Romance" },
  { id: "friendship", label: "Friendship" },
  { id: "anniversary", label: "Anniversary" },
  { id: "thank-you", label: "Thank You" },
  { id: "congratulations", label: "Congratulations" },
  { id: "just-because", label: "Just Because" },
];

/**
 * 16 Genuinely Distinct, Heartfelt Starter Templates
 * Covering all 7 categories with diverse visual themes, cover foils, and styling.
 */
export const SU_PRILO_TEMPLATES: TemplateDefinition[] = [
  // ==========================================
  // 1. Birthday (3 Templates)
  // ==========================================
  {
    id: "bday-midnight-celebration",
    title: "Midnight Sparkle Birthday",
    category: "birthday",
    categoryLabel: "Birthday",
    description: "Golden confetti explosion for milestone birthdays and joyous midnight wishes.",
    tag: "Happy Birthday! 🎂",
    recipient: "Maya",
    sender: "Alex",
    message: "“Happy 25th Birthday, Maya! ✨”",
    secondary: "May this year bring you endless happiness, wild adventures, and warm coffee.",
    coverStyle: "golden-foil",
    coverText: "Scratch to open your birthday surprise 🎂",
    bgGradient: "from-amber-50 via-white to-orange-50",
    textColor: "text-amber-950",
    badgeColor: "yellow",
    sticker: "cake",
    accentColor: "#F59E0B",
  },
  {
    id: "bday-party-confetti",
    title: "Sweet Pastels Birthday",
    category: "birthday",
    categoryLabel: "Birthday",
    description: "Cheerful playful colors with festive balloons and heartwarming appreciation.",
    tag: "Another Year Cooler 🎈",
    recipient: "Bestie",
    sender: "Sam",
    message: "“Happy Birthday to my favorite human on Earth! 💖”",
    secondary: "Your present is waiting for you in the living room. Prepare to scream!",
    coverStyle: "lavender-pink",
    coverText: "Scratch to uncover your gift reveal 🎁",
    bgGradient: "from-pink-50 via-white to-purple-50",
    textColor: "text-slate-900",
    badgeColor: "pink",
    sticker: "confetti",
    accentColor: "#FF4D6D",
  },
  {
    id: "bday-royal-vintage",
    title: "Royal Amethyst Birthday",
    category: "birthday",
    categoryLabel: "Birthday",
    description: "Sophisticated purple tones for elegant friends who deserve the royal treatment.",
    tag: "Celebrate in Style 👑",
    recipient: "Julian",
    sender: "Sarah",
    message: "“To the king of good vibes: Cheers to your big day! 🥂”",
    secondary: "We reserved your favorite rooftop table tonight at 8 PM. Dress sharp!",
    coverStyle: "cosmic-purple",
    coverText: "Scratch for your VIP birthday itinerary ✨",
    bgGradient: "from-purple-50 via-white to-indigo-50",
    textColor: "text-indigo-950",
    badgeColor: "purple",
    sticker: "trophy",
    accentColor: "#8B5CF6",
  },

  // ==========================================
  // 2. Love & Romance (3 Templates)
  // ==========================================
  {
    id: "love-secret-dinner",
    title: "Secret Candlelight Date",
    category: "love",
    categoryLabel: "Love & Romance",
    description: "Romantic rose petals and heartfelt words with a secret dinner location.",
    tag: "With All My Heart 💌",
    recipient: "My Love",
    sender: "Sam",
    message: "“Every single day with you is my favorite adventure ❤️”",
    secondary: "Pack a small bag tonight. I booked that seaside cabin you've been looking at.",
    coverStyle: "lavender-pink",
    coverText: "Scratch to uncover our secret date ❤️",
    bgGradient: "from-rose-50 via-white to-pink-50",
    textColor: "text-rose-950",
    badgeColor: "pink",
    sticker: "heart",
    accentColor: "#FF4D6D",
  },
  {
    id: "love-golden-forever",
    title: "Golden Hour Romance",
    category: "love",
    categoryLabel: "Love & Romance",
    description: "Warm golden glow celebrating an enduring bond and unbreakable love.",
    tag: "Forever & Always 💍",
    recipient: "Elena",
    sender: "David",
    message: "“You make the whole world feel like home. 🌅”",
    secondary: "Thank you for choosing me every day. Here is to a lifetime more.",
    coverStyle: "golden-foil",
    coverText: "Scratch to reveal my vow to you 💖",
    bgGradient: "from-amber-50 via-white to-rose-50",
    textColor: "text-slate-900",
    badgeColor: "yellow",
    sticker: "heart",
    accentColor: "#F59E0B",
  },
  {
    id: "love-cute-doodle",
    title: "Coffee & Cuddles",
    category: "love",
    categoryLabel: "Love & Romance",
    description: "Cute, wholesome, and sweet little surprise for casual everyday romance.",
    tag: "Just You & Me ☕",
    recipient: "Sleepyhead",
    sender: "Babe",
    message: "“I love you more than Sunday morning sleep-ins! 🥐”",
    secondary: "Breakfast in bed is already cooked. Open your eyes and come downstairs!",
    coverStyle: "mint-fresh",
    coverText: "Scratch for your morning kiss 💋",
    bgGradient: "from-emerald-50 via-white to-teal-50",
    textColor: "text-emerald-950",
    badgeColor: "neutral",
    sticker: "flower",
    accentColor: "#10B981",
  },

  // ==========================================
  // 3. Friendship (2 Templates)
  // ==========================================
  {
    id: "friendship-partner-in-crime",
    title: "Partner in Crime",
    category: "friendship",
    categoryLabel: "Friendship",
    description: "Playful, energetic appreciation for the friend who never leaves your side.",
    tag: "Ride or Die 👯‍♀️",
    recipient: "Partner in Crime",
    sender: "Your Bestie",
    message: "“Life is 1000x funnier whenever you are in the room! 😂”",
    secondary: "Emergency boba tea run is mandatory today. My treat, pick you up at 4!",
    coverStyle: "cosmic-purple",
    coverText: "Scratch for a hilarious secret 🔮",
    bgGradient: "from-purple-50 via-white to-pink-50",
    textColor: "text-slate-900",
    badgeColor: "purple",
    sticker: "sparkles",
    accentColor: "#8B5CF6",
  },
  {
    id: "friendship-grateful-heart",
    title: "True Friend Appreciation",
    category: "friendship",
    categoryLabel: "Friendship",
    description: "Gentle mint-fresh aesthetic thanking a friend who listened when it counted.",
    tag: "So Grateful For You 🌿",
    recipient: "Dear Friend",
    sender: "Alex",
    message: "“Thank you for being the calm in every storm. 🍃”",
    secondary: "I truly don't know what I would do without your advice and big heart.",
    coverStyle: "mint-fresh",
    coverText: "Scratch to reveal a heartfelt thank you 🌸",
    bgGradient: "from-emerald-50 via-white to-slate-50",
    textColor: "text-emerald-950",
    badgeColor: "neutral",
    sticker: "flower",
    accentColor: "#10B981",
  },

  // ==========================================
  // 4. Anniversary (2 Templates)
  // ==========================================
  {
    id: "anniv-milestone-gold",
    title: "Silver & Gold Anniversary",
    category: "anniversary",
    categoryLabel: "Anniversary",
    description: "Majestic metallic foil honoring shared years, milestones, and shared dreams.",
    tag: "Happy Anniversary! 🥂",
    recipient: "Darling",
    sender: "Forever Yours",
    message: "“5 Years Down, Forever to Go. 💫”",
    secondary: "Look inside your coat pocket for the boarding passes to Paris!",
    coverStyle: "golden-foil",
    coverText: "Scratch to unlock our anniversary getaway ✈️",
    bgGradient: "from-amber-50 via-white to-yellow-50",
    textColor: "text-amber-950",
    badgeColor: "yellow",
    sticker: "trophy",
    accentColor: "#D97706",
  },
  {
    id: "anniv-storybook-love",
    title: "Storybook Chapter",
    category: "anniversary",
    categoryLabel: "Anniversary",
    description: "Soft romantic pinks reflecting on how far the two of you have grown together.",
    tag: "Our Love Story 📖",
    recipient: "Soulmate",
    sender: "Your Person",
    message: "“I would choose you in every universe. 🌌”",
    secondary: "Tonight we are recreating our very first first date from 2019.",
    coverStyle: "lavender-pink",
    coverText: "Scratch to read the next chapter 💖",
    bgGradient: "from-pink-50 via-white to-rose-50",
    textColor: "text-rose-950",
    badgeColor: "pink",
    sticker: "heart",
    accentColor: "#FF4D6D",
  },

  // ==========================================
  // 5. Thank You (2 Templates)
  // ==========================================
  {
    id: "thankyou-blooming-gratitude",
    title: "Blooming Gratitude",
    category: "thank-you",
    categoryLabel: "Thank You",
    description: "Floral pastels expressing deepest thanks for kindness and generosity.",
    tag: "A Huge Thank You! 💐",
    recipient: "Kind Soul",
    sender: "Grateful Heart",
    message: "“Your kindness made all the difference in the world! 🌸”",
    secondary: "Sending you the biggest virtual hug. Coffee is on me this weekend!",
    coverStyle: "lavender-pink",
    coverText: "Scratch to receive your floral gratitude 🌷",
    bgGradient: "from-pink-50 via-white to-teal-50",
    textColor: "text-slate-900",
    badgeColor: "pink",
    sticker: "flower",
    accentColor: "#FF4D6D",
  },
  {
    id: "thankyou-mentor-honor",
    title: "Mentor & Teacher Tribute",
    category: "thank-you",
    categoryLabel: "Thank You",
    description: "Respectful royal purple finish honoring teachers, guides, and leadership.",
    tag: "Beyond Grateful 🎓",
    recipient: "Mentor",
    sender: "Mentee",
    message: "“Thank you for believing in me before I believed in myself. 🌟”",
    secondary: "Your guidance has shaped my journey in ways words can never fully capture.",
    coverStyle: "cosmic-purple",
    coverText: "Scratch to open a tribute of thanks ✨",
    bgGradient: "from-purple-50 via-white to-slate-50",
    textColor: "text-indigo-950",
    badgeColor: "purple",
    sticker: "star",
    accentColor: "#8B5CF6",
  },

  // ==========================================
  // 6. Congratulations (2 Templates)
  // ==========================================
  {
    id: "congrats-new-job-sky",
    title: "Sky is the Limit",
    category: "congratulations",
    categoryLabel: "Congratulations",
    description: "Exciting career milestones, new promotions, graduations, and achievements.",
    tag: "You Did It! 🚀",
    recipient: "Champion",
    sender: "Your Biggest Fan",
    message: "“Endlessly proud of you! You earned this! 🏆”",
    secondary: "Big things ahead for you. Time to celebrate tonight with champagne!",
    coverStyle: "golden-foil",
    coverText: "Scratch to celebrate your triumph 🎉",
    bgGradient: "from-amber-50 via-white to-orange-50",
    textColor: "text-amber-950",
    badgeColor: "orange",
    sticker: "trophy",
    accentColor: "#FF9F1C",
  },
  {
    id: "congrats-baby-arrival",
    title: "Little Miracle Welcome",
    category: "congratulations",
    categoryLabel: "Congratulations",
    description: "Soft mint and warm pastel bliss welcoming a new baby or puppy.",
    tag: "Welcome Little One! 🍼",
    recipient: "New Parents",
    sender: "Family & Friends",
    message: "“Welcome to the world, tiny miracle! 👶✨”",
    secondary: "Wishing your growing family a lifetime of laughter, health, and sweet baby snuggles.",
    coverStyle: "mint-fresh",
    coverText: "Scratch to reveal a sweet nursery wish 🧸",
    bgGradient: "from-teal-50 via-white to-emerald-50",
    textColor: "text-teal-950",
    badgeColor: "neutral",
    sticker: "sparkles",
    accentColor: "#10B981",
  },

  // ==========================================
  // 7. Just Because (2 Templates)
  // ==========================================
  {
    id: "just-because-midday-smile",
    title: "Midday Sunshine Smile",
    category: "just-because",
    categoryLabel: "Just Because",
    description: "An unexpected pick-me-up to brighten someone's Tuesday or boring afternoon.",
    tag: "Thinking of You ☀️",
    recipient: "Mom",
    sender: "Adarsh",
    message: "“Just sending a little sunshine your way today! 🌻”",
    secondary: "Take a deep breath, smile, and remember you are deeply loved.",
    coverStyle: "golden-foil",
    coverText: "Scratch for an instant dose of joy ✨",
    bgGradient: "from-amber-50 via-white to-yellow-50",
    textColor: "text-slate-900",
    badgeColor: "yellow",
    sticker: "sparkles",
    accentColor: "#FFD166",
  },
  {
    id: "just-because-virtual-hug",
    title: "A Little Pocket Hug",
    category: "just-because",
    categoryLabel: "Just Because",
    description: "Warm and cozy reminder that distance is nothing when hearts are close.",
    tag: "Pocket Hug 🤗",
    recipient: "Sweetheart",
    sender: "Me",
    message: "“Whenever you feel overwhelmed, hold this card close. 💕”",
    secondary: "I'm right here with you in spirit. You've got this, always.",
    coverStyle: "lavender-pink",
    coverText: "Scratch for your pocket hug 🧸",
    bgGradient: "from-pink-50 via-white to-purple-50",
    textColor: "text-purple-950",
    badgeColor: "pink",
    sticker: "heart",
    accentColor: "#FF4D6D",
  },
];

export function getTemplatesByCategory(
  category?: TemplateCategory | "all"
): TemplateDefinition[] {
  if (!category || category === "all") {
    return SU_PRILO_TEMPLATES;
  }
  return SU_PRILO_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return SU_PRILO_TEMPLATES.find((t) => t.id === id);
}

export const DEFAULT_SCRATCH_TEMPLATE: TemplateDefinition = {
  id: "custom-scratch",
  title: "Blank Canvas",
  category: "just-because",
  categoryLabel: "Custom",
  description: "Start with a clean slate and customize every single element from scratch.",
  tag: "Special Surprise",
  recipient: "Friend",
  sender: "Me",
  message: "“Your secret surprise message goes right here! ✨”",
  secondary: "Add a personal note, a hint, or instructions for your recipient.",
  coverStyle: "lavender-pink",
  coverText: "Scratch with your finger or mouse to reveal ✨",
  bgGradient: "from-brand-warm-subtle via-white to-brand-warm",
  textColor: "text-brand-dark",
  badgeColor: "pink",
  sticker: "sparkles",
  accentColor: "#FF4D6D",
};
