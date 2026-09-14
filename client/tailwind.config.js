/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        accent: 'var(--accent)',
        'accent-glow': 'var(--accent-glow)',
        'accent-bright': 'var(--accent-bright)',
        'accent-highlight': 'var(--accent-highlight)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        muted: 'var(--muted)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 30px -5px var(--accent-glow)',
        'glow-sm': '0 0 15px -3px var(--accent-glow)',
      },
      backgroundImage: {
        'void': 'radial-gradient(circle at 50% 50%, #1A1625 0%, #050507 100%)',
      }
    },
  },
  plugins: [],
}
