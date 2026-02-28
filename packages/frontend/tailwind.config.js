/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        coffee: {
          50: '#fdf8f0',
          100: '#f9eddb',
          200: '#f2d9b5',
          300: '#e8be85',
          400: '#dd9c53',
          500: '#d48432',
          600: '#c56c27',
          700: '#a45322',
          800: '#854322',
          900: '#6c381e',
          950: '#3a1b0e',
        },
        cream: {
          50: '#fafaf8',
          100: '#f5f4f0',
          200: '#eae8e0',
          300: '#dbd7cb',
          400: '#c4bead',
          500: '#aea592',
          600: '#9a8e7a',
          700: '#807565',
          800: '#6a6155',
          900: '#585148',
          950: '#2e2a24',
        },
        accent: {
          50: '#edfcf5',
          100: '#d4f7e5',
          200: '#aceecf',
          300: '#75dfb3',
          400: '#3dc992',
          500: '#1aae79',
          600: '#0e8d62',
          700: '#0b7151',
          800: '#0b5941',
          900: '#0a4937',
          950: '#04291f',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'drawer': '0 -4px 20px 0 rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
