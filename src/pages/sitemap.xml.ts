// The sitemap is generated rather than kept as a static file in public/ so the
// host comes from `site` in astro.config.mjs — the same source as canonical and
// og:image. A preview build (SITE_URL=...) therefore advertises the preview
// host instead of production.
//
// @astrojs/sitemap would do this too, but the route list is small and the
// catalog already owns the data needed to enumerate its generated pages.

import type { APIContext } from "astro";
import { loadCatalog } from "~/data/catalog";

// /blog/rss.xml is a feed and /index.md is a content-negotiated alternate of
// `/`, so neither belongs in the sitemap.
const STATIC_PAGES = ["/", "/featured", "/skills"];

export async function GET({ site }: APIContext) {
  // No fallback literal on purpose. `site` is set unconditionally in
  // astro.config.mjs, so a default here would be dead code that also spells the
  // domain out a fifth time — see the four-places table in CLAUDE.md. If it is
  // ever missing, failing the build is the right outcome: a sitemap full of
  // relative or wrong-host <loc> values is worse than no sitemap.
  if (!site) throw new Error("`site` is unset in astro.config.mjs");
  const base = site.toString();

  // The page has no per-route publish date to draw on, so lastmod is the build
  // time. Deploys are the only way content changes, which keeps it honest.
  const lastmod = new Date().toISOString();
  const catalog = await loadCatalog();
  const pages = [
    ...STATIC_PAGES,
    ...catalog.owners.map((owner) => owner.url),
    ...catalog.sources.map((source) => source.url),
    ...catalog.packageSkills.map((packageSkill) => packageSkill.url),
  ];

  const urls = pages.map(
    (path) => `  <url>
    <loc>${new URL(path, base).toString()}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
