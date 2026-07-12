import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f46e5", // Indigo
          dark: "#3730a3",
          light: "#e0e7ff",
        },
        accent: {
          DEFAULT: "#0ea5e9", // Sky Blue
          dark: "#0369a1",
          light: "#e0f2fe",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};
export default config;
