/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // From Figma design tokens
        background: '#0d1117',
        foreground: '#ffffff',
        card: '#24272a',
        'card-foreground': '#ffffff',
        primary: '#70a3da',
        'primary-foreground': '#ffffff',
        secondary: '#191c21',
        'secondary-foreground': '#ffffff',
        muted: '#444444',
        'muted-foreground': '#b4b4b4',
        border: '#444444',
        accent: '#70a3da',
      },
    },
  },
  plugins: [],
}

