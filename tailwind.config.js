/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme'); // Requires the default theme for extending fonts

module.exports = {
  // Tell Tailwind where to look for classes - assumes HTML is in 'public' folder
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      // Your custom colors
      colors: {
        'brand-dark': '#0F1108',
        'brand-green': '#2A9D8F',
        'brand-orange': '#C63006',
        'brand-light': '#808080',
        'brand-silver': '#B0AEC2',
        'white': '#FFFFFF',
      },
      // Your custom fonts
      fontFamily: {
        sans: ['Roboto', ...defaultTheme.fontFamily.sans], // Default body font
        montserrat: ['Montserrat', ...defaultTheme.fontFamily.sans], // Heading font
      },
    },
  },
  plugins: [],
}