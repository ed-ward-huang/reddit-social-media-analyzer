/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        twitter: {
          50: '#eff9ff',
          100: '#def2ff',
          200: '#b6e5ff',
          300: '#75d1ff',
          400: '#2cbaff',
          500: '#1da1f2',
          600: '#0f7fcf',
          700: '#0c65a7',
          800: '#10558a',
          900: '#134872',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}