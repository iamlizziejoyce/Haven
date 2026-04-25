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
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        serif: ["Cormorant Garamond", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
