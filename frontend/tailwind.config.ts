import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        church: {
          50: "#f3f7f5",
          600: "#28604e",
          700: "#1d4a3b",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
