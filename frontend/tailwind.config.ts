import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgba(255, 255, 255, 0.03)",
        "border-weak": "rgba(255, 255, 255, 0.02)",
        input: "rgba(255, 255, 255, 0.04)",
        ring: "rgba(91, 116, 255, 0.25)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        bg: "#06070A",
        "surface-1": "#0A0C10",
        "surface-2": "#0E1117",
        "surface-3": "#121621",
        text: "rgba(220, 225, 235, 0.88)",
        "text-muted": "rgba(220, 225, 235, 0.58)",
        "text-dim": "rgba(220, 225, 235, 0.38)",
        accent: {
          DEFAULT: "#4D63D8",
          dark: "#3D4BA8",
        },
        success: "#35C589",
        warning: "#D4B760",
        danger: "#CC6069",
        primary: {
          DEFAULT: "#5B74FF",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0E1117",
          foreground: "rgba(235, 238, 245, 0.92)",
        },
        destructive: {
          DEFAULT: "#E06C75",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#0E1117",
          foreground: "rgba(235, 238, 245, 0.62)",
        },
        popover: {
          DEFAULT: "#0E1117",
          foreground: "rgba(235, 238, 245, 0.92)",
        },
        card: {
          DEFAULT: "#0A0C10",
          foreground: "rgba(235, 238, 245, 0.92)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.625rem",
        sm: "0.5rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
