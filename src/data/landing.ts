// The landing page's copy, in one place.
//
// Two routes render this: src/pages/index.astro (the page) and
// src/pages/index.md.ts (the markdown twin Caddy serves to agents that send
// `Accept: text/markdown`). They used to hold two hand-maintained copies of
// the same prose, and they drifted twice — most visibly when b761193 put the
// real colors.yml in the hero and left the twin advertising a schema the
// product no longer accepts.
//
// Prose is authored in **markdown**, because the twin is a verbatim consumer.
// The page runs it through `html()` below, which drops the code ticks and
// turns bold into <strong> — so a string written once renders correctly in
// both. Only two inline markers are supported; this is deliberately not a
// markdown parser.

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Inline markdown → HTML. Safe for `set:html`: the input is the copy in this
 *  file, never anything from a request. */
export const html = (s: string) =>
  escape(s)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

export const meta = {
  title: "Colors — An SDK for Package Skills",
  description:
    "Colors is an SDK for building Package Skills. Three libraries — red, green and blue — give agents dry-run guarantees, secret indirection, and strict lifecycle control over real infrastructure.",
};

// The one string CLAUDE.md tracks across the repo. Every on-page occurrence now
// resolves to this constant; the og:image bakes its own copy in
// scripts/generate-og-image.py, which no build step can reach.
export const installCmd = "npx skills use getcolors/once";

// The real config that deploys this site — see the Deployment section of
// CLAUDE.md. Rendered by Shiki in the hero and fenced in the markdown twin.
export const colorsYml = `profile: once-colors
workdir: .colors

once:
  applications:
    - host: www.getcolors.ai
      image: ghcr.io/getcolors/colors-website:latest
      github: getcolors/colors-website

provider-compute: oci
provider-smtp: resend
provider-dns: cloudflare
provider-backend: r2
compute-prevent-destroy: true`;

export const nav = [
  { label: "Libraries", href: "#libraries" },
  { label: "Once", href: "#once" },
];

export const hero = {
  eyebrow: "An SDK for Package Skills",
  headline: "Colors is an SDK for building Package Skills.",
  lede: "Three libraries — red, green, and blue — give agents dry-run guarantees, secret indirection, and strict lifecycle control over real infrastructure, in the runtime your team already uses.",
  installNote:
    "Run inside your coding agent — it grants **Once**, a skill to provision a VPS with a personal PaaS like Netlify or Vercel.",
  ymlCaption: "# colors.yml",
};

export const primitive = {
  heading: "A different primitive for a different job",
  lede: "Web automation and infrastructure automation demand different guarantees.",
  cards: [
    {
      label: "Browser Skill",
      title: "Eyes and hands on the web",
      body: "Navigates DOM elements, fills forms, scrapes content — bridges natural language intent with web interaction.",
      accent: false,
    },
    {
      label: "Package Skill",
      title: "Determinism and lifecycle control",
      body: "Provisions platforms, infrastructures, and containers — with dry-run boundaries and strict credential handling instead of raw shell access.",
      accent: true,
    },
  ],
};

export const bundles = {
  heading: "What a Package Skill bundles",
  cards: [
    {
      label: "Desired state",
      title: "Non-secret desired state",
      body: "`colors.yml` declares hostnames, DNS zones, and mail domains directly — no separate settings to keep in sync.",
    },
    {
      label: "Runtimes",
      title: "Deterministic runtimes & launchers",
      body: "Colors’ three pinned runtimes — Bun, Babashka, or uv — not ad-hoc shell scripts.",
    },
    {
      label: "Credentials",
      title: "Environment & credential boundaries",
      body: "Secrets stay in `COLORS_PAR_*` env vars, referenced by name and never rendered into files.",
    },
  ],
};

export const libraries = {
  heading: "Three libraries. One SDK.",
  lede: "Colors is an SDK made of three interchangeable libraries for building Package Skills. Pick the runtime your team already uses — the guarantees don't change: dry-run boundaries, secret indirection, identical desired-state semantics.",
  items: [
    {
      name: "red",
      stack: "TypeScript / Bun",
      blurb: "Build Package Skills with a fast TypeScript/Bun runtime.",
      url: "https://github.com/getcolors/red",
      accent: "var(--red)",
    },
    {
      name: "green",
      stack: "Clojure / Babashka",
      blurb: "Build Package Skills with Clojure over Babashka.",
      url: "https://github.com/getcolors/green",
      accent: "var(--green)",
    },
    {
      name: "blue",
      stack: "Python / uv",
      blurb: "Build Package Skills with Python, managed by uv.",
      url: "https://github.com/getcolors/blue",
      accent: "var(--blue)",
    },
  ],
};

// The create/build DAG, in render order. `group` stacks its nodes to mark them
// as running in parallel; `branch` is the ansible pair, where github follows
// ansible-remote alone and so needs a second grid column on that row only.
export type DagItem =
  | { kind: "node"; label: string; dark?: true }
  | { kind: "edge" }
  | { kind: "group"; nodes: string[] }
  | { kind: "branch"; nodes: string[]; tail: string };

export const once = {
  eyebrow: "Example Package Skill",
  heading: "Once: a personal PaaS, built with Colors",
  lede: "Once is a Package Skill built with Colors. It provisions a VPS, configures DNS and outgoing mail, installs Docker, and reconciles declared applications — a self-hosted alternative to Netlify or Vercel that an agent runs end to end.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. Hostnames determine DNS zones and mail domains.",
    },
    {
      title: "Resolve secrets",
      body: "Env map points to `COLORS_PAR_*` variables, deferred until runtime.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds files under `.colors/` and runs `create --dry-run`, touching nothing live.",
    },
    {
      title: "Provision & reconcile",
      body: "OpenTofu provisions compute/SMTP/DNS; Ansible configures local and remote hosts.",
    },
  ],
  dagCaption: "Once — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "group", nodes: ["tofu-compute", "tofu-smtp"] },
    { kind: "edge" },
    { kind: "node", label: "tofu-dns" },
    { kind: "edge" },
    { kind: "node", label: "tofu-smtp-post" },
    { kind: "edge" },
    { kind: "branch", nodes: ["ansible-local", "ansible-remote"], tail: "github" },
  ] satisfies DagItem[],
  // Prose form of the graph above. The page draws the boxes instead, so this
  // one line is the twin's only addition rather than a duplicate.
  dagSummary:
    "The create/build DAG runs `start` → (`tofu-compute`, `tofu-smtp`) → `tofu-dns` → `tofu-smtp-post` → (`ansible-local`, `ansible-remote`), and `ansible-remote` → `github`.",
  dagNote:
    "Publishing follows the remote stage, not the local one: the deploy keys describe a configured host, so a workstation-side failure does not gate them. Delete reverses the graph — it withdraws the published credentials first, then cleanup, SMTP post and DNS, then SMTP and compute in parallel. Step failures travel as namespaced exit codes, never uncaught exceptions.",
};

export const cta = {
  heading: "Give your agent a new skill to create a personal PaaS.",
  lede: "Dry-run first. Approve. Then provision — with Once, built with Colors. Paste this into your coding agent.",
};

export const footer = {
  name: "Colors",
  href: "https://github.com/getcolors",
  label: "GitHub",
};
