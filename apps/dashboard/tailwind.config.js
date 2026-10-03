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
          DEFAULT: '#099153',
          dark: '#06703f',
          light: '#e6f4ed',
        },
        accent: {
          DEFAULT: '#f46b23',
          dark: '#d4570f',
          light: '#fef0e6',
          tint: '#fef6f0',
        },
        success: {
          DEFAULT: '#099153',
          700: '#06703f',
          tint: '#e6f4ed',
        },
        danger: {
          DEFAULT: '#ef4444',
          tint: '#fee2e2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

