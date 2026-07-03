// Tailwind v3 is wired through PostCSS here (the deprecated @astrojs/tailwind
// integration used to configure this automatically, but it does not support
// Astro 6+). Astro/Vite picks up this config for `global.css`.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
