// The one list of blog articles.
//
// It used to be three: the cards on /blog, the <item> blocks inlined in
// blog/rss.xml.ts, and a hand-typed slice of STATIC_PAGES in sitemap.xml.ts.
// Only the first was ever updated, so the two articles published on 17 August
// were linked from the index while being absent from the feed and the sitemap
// — visible to a reader, invisible to a crawler or a subscriber. Adding an
// article now means adding one entry here.
//
// Ordered newest first; /blog renders them in this order.

export interface Post {
  /** Headline, without the " — Colors" suffix the page <title> carries. */
  title: string;
  /** Route, and the RSS guid. */
  slug: string;
  /** Human date shown on the card. */
  date: string;
  /** RFC 3339 instant. The article page reads this via postFor() for its own
   *  datePublished, and the feed for pubDate, so it is the only copy. */
  isoDate: string;
  readTime: string;
  category: string;
  runtime: string;
  summary: string;
  /** Thumbnail on /blog. Not the og:image — that belongs to the article page,
   *  which needs a 1200x630 card rather than an in-article figure. */
  image: string;
  tags: string[];
}

export const posts: Post[] = [
  {
    title: "Let Your Remote Coding Agent See Your Clipboard",
    slug: "/blog/remote-clipboard-for-agents",
    date: "August 23, 2026",
    isoDate: "2026-08-23T12:00:00Z",
    readTime: "8 min read",
    category: "Architecture",
    runtime: "launchd · ssh · Nix",
    summary:
      "A coding agent on a remote machine cannot see your screen. pngpaste, socat, a launchd agent, one ssh -R forward and a small skill give it your Mac's clipboard as a Unix socket. The recipe, and the two failures that each reported success.",
    image: "/og-remote-clipboard-for-agents-v1.png",
    tags: ["Architecture", "Claude Code", "SSH", "launchd", "Nix", "Skills"],
  },
  {
    title: "You Probably Don't Need the Modern Data Stack",
    slug: "/blog/single-host-data-warehouse",
    date: "August 22, 2026",
    isoDate: "2026-08-22T12:00:00Z",
    readTime: "6 min read",
    category: "Architecture",
    runtime: "ClickHouse · dlt · dbt",
    summary:
      "For simple use cases, one $40 virtual machine running dlt, dbt, ClickHouse, PocketBase, and systemd can replace a four-figure SaaS data stack. A live single-host GitHub warehouse is the proof.",
    image: "/og-single-host-data-warehouse-v1.png",
    tags: ["Architecture", "ClickHouse", "dlt", "dbt", "PocketBase", "Single Host"],
  },
  {
    title: "Both Agents Reported Success. Only One Checked.",
    slug: "/blog/posthog-skill-benchmark",
    date: "August 18, 2026",
    isoDate: "2026-08-18T18:15:00Z",
    readTime: "7 min read",
    category: "Benchmark",
    runtime: "PostHog · DigitalOcean",
    summary:
      "Two agents deployed PostHog to DigitalOcean. One had a curated skill and used 4.4× fewer tool calls. The more useful finding: the baseline shipped a deployment it never proved could store a single event.",
    image: "/images/posthog-skill-benchmark.svg",
    tags: ["Benchmark", "PostHog", "Skills", "ClickHouse", "DigitalOcean", "Agentic DevOps"],
  },
  {
    title: "Three Analytics Stacks, Three Agents, One Uncomfortable Finding",
    slug: "/blog/self-hosted-analytics-benchmark",
    date: "August 17, 2026",
    isoDate: "2026-08-17T18:00:00Z",
    readTime: "7 min read",
    category: "Benchmark",
    runtime: "Umami · Rybbit · PostHog",
    summary:
      "Three isolated agents each built a self-hosted analytics platform as a Package Skill and deployed it live. All three reported success — and all three passed acceptance checks that could not detect a deployment serving 502s, backups that had never succeeded, or default credentials answering on the public internet.",
    image: "/images/analytics-benchmark-arms.svg",
    tags: ["Benchmark", "Umami", "Rybbit", "PostHog", "ClickHouse", "Verification"],
  },
  {
    title:
      "Benchmarking Claude Opus 5 on Autonomous Distributed Infrastructure: Building PostgreSQL & MySQL HA Clusters from Scratch",
    slug: "/blog/claude-opus-5-benchmark",
    date: "August 17, 2026",
    isoDate: "2026-08-17T20:00:00Z",
    readTime: "8 min read",
    category: "Benchmark",
    runtime: "Claude Opus 5",
    summary:
      "An empirical creation-effort benchmark evaluating Claude Opus 5 building and deploying 3-node PostgreSQL and MySQL High Availability clusters to DigitalOcean, with verified failover and continuous backups to Cloudflare R2.",
    image: "/images/claude-opus-5-ha-architecture.png",
    tags: ["Benchmark", "Claude Opus 5", "PostgreSQL HA", "MySQL HA", "Patroni", "Group Replication"],
  },
  {
    title:
      "Benchmarking Gemini 3.7 Flash on Autonomous Distributed Infrastructure: Building PostgreSQL & MySQL HA Clusters from Scratch",
    slug: "/blog/gemini-3-7-flash-benchmark",
    date: "August 16, 2026",
    isoDate: "2026-08-16T12:00:00Z",
    readTime: "7 min read",
    category: "Benchmark",
    runtime: "Gemini 3.7 Flash",
    summary:
      "An empirical creation-effort benchmark evaluating Gemini 3.7 Flash building and deploying 3-node PostgreSQL and MySQL High Availability clusters to DigitalOcean with continuous backups to Cloudflare R2.",
    image: "/images/benchmark_setup_flow_1786877790896.jpg",
    tags: ["Benchmark", "Gemini 3.7", "PostgreSQL HA", "MySQL HA", "DigitalOcean", "Cloudflare R2"],
  },
  {
    title: "Agentic DevOps Has a Compounding Advantage",
    slug: "/blog/agentic-devops-compounding-advantage",
    date: "August 15, 2026",
    isoDate: "2026-08-15T12:00:00Z",
    readTime: "5 min read",
    category: "Architecture",
    runtime: "Architecture",
    summary:
      "Why agentic DevOps accelerates faster over time: every verified Package Skill creates an executable corpus of operational knowledge that reduces the reasoning and implementation required for future deployments.",
    image: "/images/agentic_devops_compounding_advantage_1786891719453.jpg",
    tags: ["Agentic DevOps", "Architecture", "Colors SDK", "Autonomous Systems", "Compounding Advantage"],
  },
];

/** XML text escaping for the feed. */
export const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The registry entry for a route, or a build failure.
 *
 *  Article pages call this instead of restating their own dates, so isoDate
 *  here and datePublished in the page's structured data cannot disagree --
 *  they are one value. It throws rather than returning undefined because a
 *  page with no entry is the original bug: an article that renders and is
 *  linked while the feed and the sitemap have never heard of it.
 */
export function postFor(slug: string): Post {
  const post = posts.find((candidate) => candidate.slug === slug);
  if (!post) {
    throw new Error(
      `No entry in src/data/blog.ts for ${slug}. Add one, or /blog, the feed ` +
        `and the sitemap will not know the article exists.`,
    );
  }
  return post;
}
