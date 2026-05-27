import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        g0: "#1c3a10",
        g1: "#2E4F20",
        g2: "#509234",
        g3: "#7ab356",
        g4: "#b8d89a",
        cream: "#F5EDD8",
        cream2: "#e8ddc4",
        cream3: "#d9ccb0",
        terra: "#9A4F0D",
        terra2: "#e07040",
        gold: "#FFBC23",
        dark: "#1a1a0e",
        ink: "#2e2e1e",
        gray: "#6e6e5a",
        lgray: "#a8a892",
        // aliases legacy
        "verde-bosque": "#2E4F20",
        "verde-platano": "#509234",
        crema: "#F5EDD8",
        negro: "#1a1a0e",
        oro: "#FFBC23",
        tierra: "#9A4F0D",
      },
      fontFamily: {
        sans: ["var(--font-dm)", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        r: "14px",
      },
      boxShadow: {
        verde: "0 6px 32px rgba(28,58,16,0.12)",
        "verde-lg": "0 12px 48px rgba(28,58,16,0.18)",
        terra: "0 6px 28px rgba(200,90,42,0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.9s ease-out forwards",
        "step-in": "stepIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stepIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
