/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        panel: '#0f172a',      // slate-900
        panelBorder: '#1e293b', // slate-800
        cyberCrimson: '#ef4444', // Red (Critical)
        cyberAmber: '#f59e0b',   // Amber (High)
        cyberCyan: '#06b6d4',    // Cyan (Medium)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
