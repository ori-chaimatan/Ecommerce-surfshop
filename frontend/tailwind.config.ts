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
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "#101828",
        muted: "#667085",
        border: "#D0D5DD",
        horizon: "#155EEF",
        "horizon-deep": "#0E40A3",
        "horizon-ink": "#F5F9FA",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
      },
      keyframes: {
        wave: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        wave: "wave 10s linear infinite",
        "wave-slow": "wave 18s linear infinite reverse",
      },
    },
  },
  plugins: [],
};
export default config;
