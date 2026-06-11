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
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        'fluid-xs': 'clamp(0.7rem, 1.5vw, 0.85rem)',
        'fluid-sm': 'clamp(0.8rem, 2vw, 1rem)',
        'fluid-base': 'clamp(0.95rem, 2.5vw, 1.1rem)',
      },
      spacing: {
        'safe-viewport': 'max(1rem, env(safe-area-inset-left))',
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
