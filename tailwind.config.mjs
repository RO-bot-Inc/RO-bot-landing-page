/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2137',
          light: '#1A3350',
        },
        teal: {
          DEFAULT: '#2A9D8F',
          light: '#2DD4BF',
          dark: '#1F7A6F',
        },
        muted: '#A0B3C6',
        surface: '#F7F9FC',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
