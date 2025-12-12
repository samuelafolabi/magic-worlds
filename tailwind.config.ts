import type { Config } from "tailwindcss";

const config: Config = {
  // Force dark mode - always use dark theme regardless of system preference
  // Base colors are overridden in globals.css @theme to be dark
  darkMode: "class",

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#40b0bf",
          secondary: "#d2a64e",
          accent: "#04d27f",
        },
      },
    },
  },
};

export default config;
