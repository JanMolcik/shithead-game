/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'card-red': '#dc2626',
        'card-black': '#1f2937',
        'table-green': '#16a34a',
      },
      fontFamily: {
        'game': ['Arial', 'sans-serif'],
      },
      animation: {
        'card-flip': 'cardFlip 0.3s ease-in-out',
        'card-slide': 'cardSlide 0.4s ease-out',
      },
    },
  },
  plugins: [],
}