/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        border: '#1e1e2e',
        accent: '#c8f135',
        'accent-dim': '#8fb520',
        muted: '#4a4a6a',
        text: '#e8e8f0',
        'text-dim': '#8888aa',
        winner: '#c8f135',
        loser: '#ff4d6d',
        neutral: '#8888aa',
      },
    },
  },
  plugins: [],
}
