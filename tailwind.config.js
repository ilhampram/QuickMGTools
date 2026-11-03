/** @type {import('tailwindcss').Config} */
// ponytail: vanilla Tailwind v3 JIT scanning HTML+JS. Ceiling: arbitrary values inline; upgrade path: extract theme tokens (colors, shadows) to config when design system grows.
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
