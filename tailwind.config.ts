import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF9",
          100: "#FAF7F2",
          200: "#F3EDE2",
          300: "#E6DDD0",
        },
        espresso: {
          800: "#3D302B",
          900: "#2C221E",
        },
        rosewarm: {
          100: "#F7ECEE",
          300: "#D8B2B8",
          500: "#B57B84",
          600: "#9C626B",
          700: "#7F4B53",
        },
        gold: {
          100: "#F9F3E6",
          400: "#D4B475",
          500: "#C5A059",
          600: "#A8843E",
        },
      },
      fontFamily: {
        sans: ["var(--font-tajawal)", "sans-serif"],
        serif: ["var(--font-amiri)", "serif"],
      },
      boxShadow: {
        luxury: "0 10px 30px -5px rgba(44, 34, 30, 0.06), 0 4px 12px -2px rgba(44, 34, 30, 0.04)",
        "luxury-hover": "0 20px 40px -10px rgba(181, 123, 132, 0.16), 0 8px 16px -4px rgba(44, 34, 30, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
