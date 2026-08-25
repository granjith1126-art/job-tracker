/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090E',
          900: '#0A0D15',
          850: '#0C101A',
          800: '#0E1422',
          700: '#141B2D',
          600: '#1E2638',
          500: '#2A3752'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}