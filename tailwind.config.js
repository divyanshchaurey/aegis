/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mono: {
          950: "#09090b", // Deep pitch black
          900: "#121215", // Charcoal black
          850: "#18181b", // Dark charcoal
          800: "#27272a", // Mid grey
          700: "#3f3f46", // Border grey
          500: "#71717a", // Muted slate
          400: "#a1a1aa", // Silver slate
          200: "#e4e4e7", // Light silver
          100: "#f4f4f5", // Off white
          white: "#ffffff",
        },
      },
      fontFamily: {
        display: ["'Unbounded'", "var(--font-display)", "Syne", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.3, transform: "scale(1)" },
          "50%": { opacity: 0.9, transform: "scale(1.04)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s infinite linear",
        "pulse-glow": "pulseGlow 2.5s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
