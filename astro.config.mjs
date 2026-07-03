import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { visit } from 'unist-util-visit';

function rehypeOpenLinksInNewTab() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a' && node.properties?.href) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }
    });
  };
}

export default defineConfig({
  site: 'https://ro-bot.io',
  // Astro 7 changed the compressHTML default to 'jsx', which collapses
  // whitespace between adjacent inline elements. Pin to the prior default so
  // copy spacing is preserved exactly as it rendered pre-upgrade.
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('privacy-extension') && !page.includes('thank-you'),
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeOpenLinksInNewTab],
  },
});
