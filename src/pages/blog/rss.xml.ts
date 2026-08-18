// Colors Blog RSS feed, generated from src/data/blog.ts.
//
// The items were inlined here as literal XML, so the feed only ever carried
// whichever articles someone remembered to paste in: two of four, with the
// newest missing. It now derives from the same list the /blog page renders.
//
// Like sitemap.xml.ts, the host comes from `site` in astro.config.mjs so a
// preview build advertises the preview host rather than production.

import type { APIContext } from "astro";
import { escapeXml, posts } from "~/data/blog";

export async function GET({ site }: APIContext) {
  // No fallback literal, for the same reason as the sitemap: a feed full of
  // wrong-host links is worse than a failed build.
  if (!site) throw new Error("`site` is unset in astro.config.mjs");
  const base = site.toString().replace(/\/$/, "");

  const items = posts
    .map((post) => {
      const url = `${base}${post.slug}`;
      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${new Date(post.isoDate).toUTCString()}</pubDate>
    <description>${escapeXml(post.summary)}</description>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Colors Blog</title>
  <link>${base}/blog</link>
  <description>Technical articles, benchmarks, and architectural deep-dives into Agentic DevOps and Colors.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${base}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
