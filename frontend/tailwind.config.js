/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        serene: {
          50: '#fbfaf8',
          100: '#f5f2eb',
          200: '#e9e3d5',
          300: '#d7ccb6',
          400: '#bfad92',
          500: '#a79072',
          600: '#8e7558',
          700: '#725b44',
          800: '#5c4939',
          900: '#4c3d31',
        },
        vedic: {
          amber: '#d97706',
          gold: '#b45309',
          saffron: '#ea580c',
          terracotta: '#c2410c',
          sage: '#4d7c0f',
          indigo: '#4338ca'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
