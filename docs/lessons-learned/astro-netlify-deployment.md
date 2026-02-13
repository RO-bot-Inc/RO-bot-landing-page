# Astro + Netlify Deployment - Lessons Learned

**Feature**: Landing page redesign with Astro, Tailwind, and Netlify deployment
**Implementation Date**: 2026-02-13
**Status**: Production Ready

---

## Executive Summary

Completed a full site redesign using Astro + Tailwind CSS and deployed to Netlify with custom domain (ro-bot.io). Encountered several subtle issues around CSS selectors, ESM imports, and file precedence that caused unexpected behavior.

---

## Key Lessons Learned

### 1. CSS ID Selectors Cannot Start with Digits

**Problem**: Added `scroll-margin-top` to global.css targeting `#3cs` - it had no effect.

**Root Cause**: In CSS, ID selectors starting with a digit are invalid without escaping. The selector `#3cs` is silently ignored by browsers.

**Solution**: Use Tailwind utility classes directly on elements instead:
```html
<!-- Instead of CSS: #3cs { scroll-margin-top: 120px; } -->
<div id="3cs" class="scroll-mt-28">
```

**Prevention**: When creating IDs for jump links, either:
- Use letter-prefixed IDs (`section-3cs` instead of `3cs`)
- Apply scroll-margin via Tailwind classes directly on elements

---

### 2. ESM Config Files Need ESM Imports

**Problem**: Added `@tailwindcss/typography` to `tailwind.config.mjs` using `require()` - plugin didn't load.

**Root Cause**: `.mjs` files use ES Modules. CommonJS `require()` syntax doesn't work.

**Solution**:
```javascript
// Wrong (CommonJS in ESM file)
plugins: [require('@tailwindcss/typography')]

// Correct (ESM)
import typography from '@tailwindcss/typography';
plugins: [typography]
```

**Prevention**: Always check file extension - `.mjs` = ESM imports, `.cjs` = CommonJS requires.

---

### 3. Astro public/ Files Override Generated Pages

**Problem**: Privacy and Terms pages were missing header/footer despite correct Astro code.

**Root Cause**: Old `privacy.html` and `terms.html` files existed in `public/` folder. Astro copies public/ files directly to dist/, which overrode the generated `/privacy/index.html` pages.

**Solution**: Delete old HTML files from `public/` folder:
```bash
rm public/privacy.html public/terms.html
```

**Prevention**: When migrating from static HTML to Astro:
1. Check `public/` for conflicting HTML files
2. Remove or rename any files that conflict with Astro page routes
3. Verify with `ls dist/*.html` after build - only `index.html` should be at root

---

### 4. Netlify CLI Deploy vs GitHub Auto-Deploy

**Context**: Site was linked to GitHub repo with auto-deploy enabled.

**Observation**: CLI deploys work immediately but can be overwritten by GitHub auto-deploys triggered by pushes.

**Best Practice**:
- Use CLI deploy for quick testing
- Always commit and push changes so GitHub auto-deploy stays in sync
- Check `npx netlify-cli api listSiteDeploys` to see deploy history

---

## Technical Details

### Files Modified
- `tailwind.config.mjs` - ESM import for typography plugin
- `src/styles/global.css` - Removed invalid CSS selectors
- `src/components/Solution.astro` - Added `scroll-mt-28` classes to section IDs
- `public/privacy.html` - DELETED
- `public/terms.html` - DELETED

### Build Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

---

## Debugging Approach That Worked

When pages weren't rendering correctly despite correct source code:

1. **Check the built output directly**: `head -60 dist/privacy/index.html`
2. **Check what the live server is serving**: `curl -sL https://site.com/page | head -30`
3. **Compare built vs served content** to identify mismatches
4. **Search for conflicting files**: `find . -name "*.html" -not -path "*/node_modules/*"`

---

## Replication Template

When deploying an Astro site to Netlify:

```bash
# 1. Build locally and verify
npm run build
ls dist/  # Check structure

# 2. Deploy via CLI to test
npx netlify-cli deploy --prod --dir=dist

# 3. Verify live content matches build
curl -sL https://your-site.com/page | head -30

# 4. If mismatch, check public/ for conflicting files
find public -name "*.html"

# 5. Commit and push for GitHub auto-deploy sync
git add -A && git commit -m "Deploy fixes" && git push
```

---

## Future Applications

These lessons apply to:
- Any Astro project with jump links using numeric IDs
- Migrating static HTML sites to Astro
- Any project using Tailwind plugins in ESM config files
- Debugging Netlify deployment issues
