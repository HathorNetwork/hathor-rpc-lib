/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1b23',
        card: '#252530',
        'card-border': '#2e2f3a',
        primary: {
          DEFAULT: '#8B5CF6',
          light: '#9E66FF',
          dark: '#7B3FF2',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        error: '#EF4444',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #7B3FF2, #9E66FF)',
      },
    },
  },
  plugins: [],
}