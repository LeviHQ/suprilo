import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#FF4D6D",
          "pink-hover": "#F03A5C",
          "pink-light": "#FFF0F3",
          "pink-subtle": "#FFE3E8",
          orange: "#FF9F1C",
          "orange-light": "#FFF6E8",
          purple: "#8B5CF6",
          "purple-light": "#F5EFFF",
          yellow: "#FFD166",
          "yellow-light": "#FFFBE6",
          dark: "#17152A",
          muted: "#5E5B70",
          warm: "#FFFDFB",
          "warm-card": "#FFFFFF",
          "warm-subtle": "#F9F6F0",
          "warm-border": "#EFE8DC",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Plus Jakarta Sans", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(23, 21, 42, 0.05), 0 2px 6px -1px rgba(23, 21, 42, 0.03)",
        "card-hover": "0 12px 30px -4px rgba(23, 21, 42, 0.08), 0 4px 12px -2px rgba(23, 21, 42, 0.04)",
        glow: "0 0 25px -5px rgba(255, 77, 109, 0.25)",
        "glow-purple": "0 0 25px -5px rgba(139, 92, 246, 0.25)",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseGently: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        "marquee-ltr": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
        "marquee-rtl": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s infinite",
        float: "float 4s ease-in-out infinite",
        "pulse-gentle": "pulseGently 3s ease-in-out infinite",
        "marquee-ltr": "marquee-ltr 52s linear infinite",
        "marquee-rtl": "marquee-rtl 58s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
