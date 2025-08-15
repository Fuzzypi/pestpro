// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <-- enable class-based dark mode
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // (optional) tweak radii/shadows if you want a softer dark theme later
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
