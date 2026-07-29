// Generated rather than a static public/robots.txt so the Sitemap line carries
// the same host as canonical and og:image — see src/pages/sitemap.xml.ts.

import type { APIContext } from "astro";

export async function GET({ site }: APIContext) {
  // No fallback literal — see the comment in sitemap.xml.ts.
  if (!site) throw new Error("`site` is unset in astro.config.mjs");
  const sitemap = new URL("/sitemap.xml", site).toString();

  const body = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
