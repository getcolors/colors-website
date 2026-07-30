# Colors Website

Static Astro site for `https://www.getcolors.ai`. One page.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm typecheck   # astro check — CI runs this before it builds an image
```

## Structure

- `src/pages/index.astro` is the landing page, and the only page.
- `src/data/landing.ts` holds its copy. `index.astro` and `index.md.ts` both
  render it, so the page and its markdown twin cannot drift.
- `src/pages/blog/rss.xml.ts` serves an empty feed at the blog's old URL.
- `src/components/SeoMeta.astro` holds the shared canonical and social tags.
- `public/fonts/` holds the self-hosted IBM Plex woff2 files.
- `public/og-colors-v2.png` is the og:image; regenerate it with
  `scripts/generate-og-image.py` rather than editing it by hand. Change the
  filename whenever the artwork changes — social unfurl caches key on the URL.

To check a link preview before deploying, build against the preview host so
`og:image` is not still pointing at production:

```bash
SITE_URL=https://<preview-host> pnpm build
```
- `plans/colors-landing-page-export.html` is the design export the page was
  ported from. It is a reference, not a build input.

Retired routes — the blog, `/manual`, `/once`, `/walter`, and the talk decks —
are 301'd to `/` by the `handle_errors` block in `Caddyfile.prod`.

The site uses Astro. There is no CSS framework; the page is styled by a single
stylesheet in `index.astro`, with the palette as `oklch()` custom properties.
