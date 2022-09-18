/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./src/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans Devanagari", "sans-serif"],
      },
      colors: {
        primary: {
          light: "#0049C9",
          default: "#012470",
          dark: "#00173F",
        },
        teal: {
          light: "#00E2B7",
          dark: "#009377",
        },
        black: "#202020",
      },
    },
  },
  variants: {},
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    // require("@tailwindcss/aspect-ratio"),
  ],
};
