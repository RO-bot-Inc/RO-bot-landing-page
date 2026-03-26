import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ro-bot.io',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('privacy-extension') && !page.includes('thank-you'),
    }),
  ],
});
