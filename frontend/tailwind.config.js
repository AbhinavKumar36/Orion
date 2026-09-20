/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: "#0d131f",
        card: "#121a2a",
        border: "#1e293b",
        primary: {
          DEFAULT: "#00f2fe",
          hover: "#4facfe",
        },
        severity: {
          safe: "#10b981",
          low: "#06b6d4",
          medium: "#f59e0b",
          high: "#f97316",
          critical: "#ef4444",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.6))' },
          '50%': { opacity: '.6', filter: 'drop-shadow(0 0 2px rgba(0, 242, 254, 0.2))' },
        },
      },
    },
  },
  plugins: [],
}
