// Markdown for Agents. Caddy rewrites `/` to `/index.md` when the request
// carries `Accept: text/markdown` — see the @markdown handle in Caddyfile.prod.
// Browsers send Accept: text/html and keep getting index.astro.
//
// The copy here MIRRORS src/pages/index.astro by hand. There is no shared
// source: the landing page was ported from a design export as inline-styled
// HTML, and extracting its strings would mean rewriting the whole page. Edit
// both when the copy changes. In particular `npx skills use getcolors/once`
// now appears five times in the repo, not four.

import type { APIContext } from "astro";

export async function GET({ site }: APIContext) {
  // No fallback literal — see the comment in sitemap.xml.ts.
  if (!site) throw new Error("`site` is unset in astro.config.mjs");
  const canonical = new URL("/", site).toString();

  const body = `# Colors — An SDK for Package Skills

> Colors is an SDK for building Package Skills. Three libraries — red, green
> and blue — give agents dry-run guarantees, secret indirection, and strict
> lifecycle control over real infrastructure.

Canonical HTML: ${canonical}

## Install

Run inside your coding agent — it grants **Once**, a skill to provision a VPS
with a personal PaaS like Netlify or Vercel.

\`\`\`sh
npx skills use getcolors/once
\`\`\`

A Package Skill is configured with a \`colors.yml\`:

\`\`\`yaml
host: app.example.com
env:
  site-database-url:
    -> COLORS_PAR_SITE_DATABASE_URL
dns: managed
smtp: managed
apps:
  - once/site
\`\`\`

## A different primitive for a different job

Web automation and infrastructure automation demand different guarantees.

- **Browser Skill — eyes and hands on the web.** Navigates DOM elements, fills
  forms, scrapes content — bridges natural language intent with web interaction.
- **Package Skill — determinism and lifecycle control.** Provisions platforms,
  infrastructures, and containers — with dry-run boundaries and strict
  credential handling instead of raw shell access.

## What a Package Skill bundles

- **Non-secret desired state.** \`colors.yml\` declares hostnames, DNS zones, and
  mail domains directly — no separate settings to keep in sync.
- **Deterministic runtimes & launchers.** Colors' three pinned runtimes — Bun,
  Babashka, or uv — not ad-hoc shell scripts.
- **Environment & credential boundaries.** Secrets stay in \`COLORS_PAR_*\` env
  vars, referenced by name and never rendered into files.

## Three libraries. One SDK.

Colors is an SDK made of three interchangeable libraries for building Package
Skills. Pick the runtime your team already uses — the guarantees don't change:
dry-run boundaries, secret indirection, identical desired-state semantics.

| Library | Runtime | Repository |
|---|---|---|
| red | TypeScript / Bun | https://github.com/getcolors/red |
| green | Clojure / Babashka | https://github.com/getcolors/green |
| blue | Python / uv | https://github.com/getcolors/blue |

## Once: a personal PaaS, built with Colors

Once is a Package Skill built with Colors. It provisions a VPS, configures DNS
and outgoing mail, installs Docker, and reconciles declared applications — a
self-hosted alternative to Netlify or Vercel that an agent runs end to end.

1. **Read desired state.** Agent reads \`colors.yml\`. Hostnames determine DNS
   zones and mail domains.
2. **Resolve secrets.** Env map points to \`COLORS_PAR_*\` variables, deferred
   until runtime.
3. **Dry-run boundary.** Builds files under \`.once/\` and runs
   \`create --dry-run\`, touching nothing live.
4. **Provision & reconcile.** OpenTofu provisions compute/SMTP/DNS; Ansible
   configures local and remote hosts.

The create/build DAG runs \`start\` → (\`tofu-compute\`, \`tofu-smtp\`) →
\`tofu-dns\` → \`tofu-smtp-post\` → (\`ansible-local\`, \`ansible-remote\`).
Delete runs cleanup, SMTP post, and DNS, then SMTP and compute in parallel.
Step failures travel as namespaced exit codes, never uncaught exceptions.

## Give your agent a new skill to create a personal PaaS

Dry-run first. Approve. Then provision — with Once, built with Colors. Paste
this into your coding agent:

\`\`\`sh
npx skills use getcolors/once
\`\`\`

---

Colors — https://github.com/getcolors
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
