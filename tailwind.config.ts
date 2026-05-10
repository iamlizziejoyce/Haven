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
        navy: "#1A2B42",
        cream: "#F6F1EA",
        gold: "#C4A35A",
        sage: "#7B9E87",
        mid: "#E2DDD6",
        muted: "#9A9086",
        dark: "#0E1820",
        peach: "#F5E0D0",
        "peach-dark": "#EAC9B0",
        "peach-light": "#FAF0E8",
        "warm-bg": "#F7EDE4",
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
