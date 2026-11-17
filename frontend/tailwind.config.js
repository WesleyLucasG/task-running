/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f97316',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        navy: {
          950: '#050a12',
          900: '#070c17',
          800: '#0f1724',
          700: '#141e2e',
          600: '#1a2740',
          500: '#223354',
        },
      },
      fontFamily: {
        game: ['Rajdhani', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
