/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Mona Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // From Figma design tokens
        background: '#0D1117',
        foreground: '#FFFFFF',
        card: '#24292F',
        'card-foreground': '#FFFFFF',
        primary: {
          DEFAULT: '#8C46FF',
          400: '#BA90FF',
          500: '#8C46FF',
          600: '#542A99',
        },
        'primary-foreground': '#FFFFFF',
        secondary: '#191C21',
        'secondary-foreground': '#FFFFFF',
        muted: '#57606A',
        'muted-foreground': '#E8EAED',
        border: '#24292F',
        accent: '#71A3DA',
        'accent-foreground': '#FFFFFF',
        neutral: {
          100: '#FFFFFF',
          500: '#57606A',
          700: '#21262D',
        },
      },
    },
  },
  plugins: [],
}

