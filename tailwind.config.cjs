/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f6ff',
          100: '#e1e8ff',
          200: '#c2d1ff',
          300: '#99b2ff',
          400: '#6a8aff',
          500: '#3c5eff',
          600: '#2342e6',
          700: '#1731b4',
          800: '#132a8c',
          900: '#12276f'
        },
      },
    },
  },
  plugins: [],
};
