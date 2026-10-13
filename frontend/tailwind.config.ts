import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "#101828",
        muted: "#667085",
        border: "#D0D5DD",
        horizon: "#155EEF",
        "horizon-deep": "#0E40A3",
        "horizon-ink": "#F5F9FA",
        danger: "#C0392B",
        surface: "#F9F9F9",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      keyframes: {
        wave: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "drawer-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        wave: "wave 10s linear infinite",
        "wave-slow": "wave 18s linear infinite reverse",
        "drawer-in": "drawer-in .25s ease",
        "fade-in": "fade-in .2s ease",
      },
    },
  },
  plugins: [],
};
export default config;
