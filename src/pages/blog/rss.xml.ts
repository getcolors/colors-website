// The blog was retired with the Colors rebrand. The feed stays at its original
// URL and returns a valid but empty channel rather than a 404, so existing
// subscribers keep the subscription instead of their reader dropping it.

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Colors Blog</title>
  <link>https://www.getcolors.ai/</link>
  <description>Articles about Agentic DevOps and Colors.</description>
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
