import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { visit } from 'unist-util-visit';

// Link policy for markdown body content.
//
// Internal links stay in the same tab and are normalized to the trailing-slash
// URL Astro actually serves. Without the slash, Netlify 301s /about -> /about/,
// so Googlebot followed every internal link into a redirect and filed the
// non-slash URL under "Page with redirect" / "Crawled - currently not indexed".
// Normalizing here (rather than in each .md file) keeps future posts correct.
//
// Keeping internal links in the same tab also preserves the referrer, so GA4
// attributes blog -> /book-demo/ conversions to the post that drove them.
function rehypeLinkPolicy() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;

      const href = node.properties?.href;
      if (typeof href !== 'string' || href === '') return;

      // In-page anchors: leave untouched.
      if (href.startsWith('#')) return;

      if (href.startsWith('/')) {
        const [path, hash] = href.split('#');
        // Skip asset paths (/blog-assets/foo.png) — only pages get a slash.
        const isAsset = /\.[a-z0-9]+$/i.test(path);
        if (path && !path.endsWith('/') && !isAsset) {
          node.properties.href = `${path}/${hash ? `#${hash}` : ''}`;
        }
        return;
      }

      // External http(s) only. mailto:/tel: are left alone so they don't
      // spawn a blank tab.
      if (/^https?:\/\//i.test(href)) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }
    });
  };
}

export default defineConfig({
  site: 'https://tenthgear.ai',
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
    rehypePlugins: [rehypeLinkPolicy],
  },
});
