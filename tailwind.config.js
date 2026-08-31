/** @type {import('tailwindcss').Config} */
const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1240px" },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        paper: withAlpha("--paper"),
        surface: withAlpha("--surface"),
        raised: withAlpha("--raised"),
        ink: withAlpha("--ink"),
        quiet: withAlpha("--quiet"),
        faint: withAlpha("--faint"),
        rule: withAlpha("--rule"),
        ember: {
          DEFAULT: withAlpha("--ember"),
          soft: withAlpha("--ember-soft"),
          ink: withAlpha("--ember-ink"),
        },
        dusk: {
          DEFAULT: withAlpha("--dusk"),
          soft: withAlpha("--dusk-soft"),
        },
        sage: {
          DEFAULT: withAlpha("--sage"),
          soft: withAlpha("--sage-soft"),
        },
        danger: {
          DEFAULT: withAlpha("--danger"),
          soft: withAlpha("--danger-soft"),
        },
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        // Shade comes from --shadow, not --ink: in dark mode --ink is a pale
        // paper white, and casting a shadow in it makes every card glow.
        press: "0 1px 0 0 rgb(var(--shadow) / 0.06), 0 1px 2px -1px rgb(var(--shadow) / 0.14)",
        card: "0 1px 1px rgb(var(--shadow) / 0.05), 0 8px 24px -16px rgb(var(--shadow) / 0.4)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.06), 0 18px 40px -22px rgb(var(--shadow) / 0.5)",
        seal: "0 0 0 1px rgb(var(--ember) / 0.35), 0 8px 20px -10px rgb(var(--ember) / 0.55)",
        inset: "inset 0 1px 0 0 rgb(255 255 255 / 0.55)",
      },
      letterSpacing: {
        label: "0.14em",
        tightest: "-0.035em",
      },
      transitionTimingFunction: {
        paper: "cubic-bezier(0.22, 1, 0.36, 1)",
        seal: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "seal-in": {
          "0%": { opacity: "0", transform: "scale(0.75) rotate(-12deg)" },
          "70%": { opacity: "1", transform: "scale(1.06) rotate(2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        "ember-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.95", transform: "scale(1.08)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-10px,0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "unfold": {
          from: { opacity: "0", transform: "perspective(900px) rotateX(-14deg) translateY(10px)" },
          to: { opacity: "1", transform: "perspective(900px) rotateX(0deg) translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.6s ease-out both",
        "seal-in": "seal-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
        "ember-pulse": "ember-pulse 4s ease-in-out infinite",
        drift: "drift 9s ease-in-out infinite",
        marquee: "marquee 42s linear infinite",
        unfold: "unfold 0.55s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.8s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
