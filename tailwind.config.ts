import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        moza: {
          orange: "#FF5F00",
          dark: "#0F0F0F",
          gray: "#1A1A1A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
