/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00a457',
          dark: '#007a42',
          light: '#e2f5ea',
        },
        success: {
          DEFAULT: '#10b981',
          700: '#047857',
          tint: '#d1fae5',
        },
        danger: {
          DEFAULT: '#ef4444',
          tint: '#fee2e2',
        }
      }
    },
  },
  plugins: [],
}
