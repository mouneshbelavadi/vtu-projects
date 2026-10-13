import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Override color palette completely: only design tokens permitted
    colors: {
      transparent: "transparent",
      current: "currentColor",
      paper: "var(--color-paper)",
      surface: "var(--color-surface)",
      ink: "var(--color-ink)",
      "ink-2": "var(--color-ink-2)",
      "ink-3": "var(--color-ink-3)",
      rule: "var(--color-rule)",
      "rule-strong": "var(--color-rule-strong)",
      accent: {
        DEFAULT: "var(--color-accent)",
        hover: "var(--color-accent-hover)",
        weak: "var(--color-accent-weak)",
      },
      warn: {
        text: "var(--color-warn-text)",
        bg: "var(--color-warn-bg)",
      },
      danger: {
        DEFAULT: "var(--color-danger)",
        text: "var(--color-danger)",
        bg: "var(--color-danger-bg)",
      },
      success: {
        DEFAULT: "var(--color-success)",
        text: "var(--color-success)",
        bg: "var(--color-success-bg)",
      },
    },
    // Reset radius scale: 0 for tables, 4px for badges/tags, 6px default
    borderRadius: {
      none: "0px",
      sm: "4px",
      DEFAULT: "6px",
      md: "6px",
      full: "9999px", // Strictly restricted to Radio component
    },
    // Reset shadows: no shadows anywhere
    boxShadow: {
      none: "none",
    },
    // Reset animations: no animations anywhere
    animation: {
      none: "none",
    },
    extend: {
      fontFamily: {
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        sans: ["var(--font-ibm-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "Courier New", "monospace"],
      },
      maxWidth: {
        container: "1120px",
        prose: "68ch",
      },
      transitionDuration: {
        DEFAULT: "120ms",
        "120": "120ms",
      },
    },
  },
  plugins: [],
};

export default config;
