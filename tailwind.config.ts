import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#201826",
        paper: "#fbf7f1",
        porcelain: "#fffdf9",
        morada: "#61248f",
        grape: "#4b176f",
        sage: "#9aa58f",
        clay: "#b77f64"
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 55px rgba(39, 24, 50, 0.10)"
      }
    }
  },
  plugins: []
} satisfies Config;
