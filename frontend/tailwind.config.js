/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MS Todo 느낌의 블루 포인트 컬러 추가
        primary: {
          50: '#ebf8ff',
          100: '#bee3f8',
          500: '#4299e1',
          600: '#3182ce',
          700: '#2b6cb0',
        }
      }
    },
  },
  plugins: [],
}