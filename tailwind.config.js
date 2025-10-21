import { heroui } from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: "#f5f3f7",
              100: "#e9e4ef",
              200: "#d2c9df",
              300: "#b7a8ca",
              400: "#9a87b3",
              500: "#7d669c",   // tono principal
              600: "#5f4b7a",
              700: "#45365a",
              800: "#2d223b",
              900: "#25142D",   // tu base original
              DEFAULT: "#25142D",
              foreground: "#ffffff",
            },
            secondary: {
              50: "#fdf3f8",
              100: "#fae4ef",
              200: "#f5c7df",
              300: "#eea4c9",
              400: "#e278aa",
              500: "#d14e8b",
              600: "#b83466",   // tu base original
              700: "#922951",
              800: "#6d1f3d",
              900: "#471428",
              DEFAULT: "#A83466",
              foreground: "#ffffff",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              50: "#f5f3f7",
              100: "#e9e4ef",
              200: "#d2c9df",
              300: "#b7a8ca",
              400: "#9a87b3",
              500: "#7d669c",   // tono principal
              600: "#5f4b7a",
              700: "#45365a",
              800: "#2d223b",
              900: "#25142D",   // tu base original
              DEFAULT: "#25142D",
              foreground: "#0b0b0b"
            },
            secondary: {
              50: "#fdf3f8",
              100: "#fae4ef",
              200: "#f5c7df",
              300: "#eea4c9",
              400: "#e278aa",
              500: "#d14e8b",
              600: "#b83466",   // tu base original
              700: "#922951",
              800: "#6d1f3d",
              900: "#471428",
              DEFAULT: "#A83466",
              foreground: "#0b0b0b"
            }
          }
        },
      }
    },)
  ],
}

module.exports = config;