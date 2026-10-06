/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          light: "#ffffff",
          dark: "#0a0a0a",
        },
        border: {
          light: "#e5e5e5",
          dark: "#262626",
        },
      },
    },
  },
  plugins: [],
};
