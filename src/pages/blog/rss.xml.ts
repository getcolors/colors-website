// Colors Blog RSS feed with technical articles and benchmarks.

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Colors Blog</title>
  <link>https://www.getcolors.ai/blog</link>
  <description>Technical articles, benchmarks, and architectural deep-dives into Agentic DevOps and Colors.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="https://www.getcolors.ai/blog/rss.xml" rel="self" type="application/rss+xml"/>
  <item>
    <title>Benchmarking Gemini 3.7 Flash on Autonomous Distributed Infrastructure: Building PostgreSQL &amp; MySQL HA Clusters from Scratch</title>
    <link>https://www.getcolors.ai/blog/gemini-3-7-flash-benchmark</link>
    <guid isPermaLink="true">https://www.getcolors.ai/blog/gemini-3-7-flash-benchmark</guid>
    <pubDate>Sun, 16 Aug 2026 12:00:00 GMT</pubDate>
    <description>An empirical creation-effort benchmark evaluating Gemini 3.7 Flash building and deploying 3-node PostgreSQL and MySQL High Availability clusters to DigitalOcean with continuous backups to Cloudflare R2.</description>
  </item>
  <item>
    <title>Agentic DevOps Has a Compounding Advantage</title>
    <link>https://www.getcolors.ai/blog/agentic-devops-compounding-advantage</link>
    <guid isPermaLink="true">https://www.getcolors.ai/blog/agentic-devops-compounding-advantage</guid>
    <pubDate>Sat, 15 Aug 2026 12:00:00 GMT</pubDate>
    <description>Why agentic DevOps accelerates faster over time: every verified Package Skill creates an executable corpus of operational knowledge that reduces the reasoning and implementation required for future deployments.</description>
  </item>
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
