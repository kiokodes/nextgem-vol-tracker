import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      colors: {
        gem: {
          gold: "#C9973A",
          "gold-light": "#E8B84B",
          "gold-dark": "#A67C2A",
          green: "#1A3A2A",
          "green-mid": "#2D5A40",
          "green-light": "#3D7A56",
          cream: "#FAF5EC",
          "cream-dark": "#F0E8D8",
          charcoal: "#1C1C1E",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,151,58,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(201,151,58,0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
