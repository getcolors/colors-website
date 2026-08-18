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
  /** RFC 3339 instant, and the only machine-readable date. Must agree with
   *  datePublished in the article's structured data. */
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
