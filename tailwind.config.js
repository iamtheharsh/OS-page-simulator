/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E91E63',
        darkbg: '#121212',
        cardbg: '#1E1E2F'
      }
    },
  },
  plugins: [],
}
