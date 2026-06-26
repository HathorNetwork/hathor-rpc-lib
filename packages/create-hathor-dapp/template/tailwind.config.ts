import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hathor: {
          primary: "#6B46C1",
          secondary: "#805AD5",
          accent: "#9F7AEA",
          dark: "#4C1D95",
        },
      },
    },
  },
  plugins: [],
};
export default config;
