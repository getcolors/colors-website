# CLAUDE.md - AI Assistant Guide

## Project Overview

This is the static website for Colors, an SDK for building Package Skills. The
product was previously called BigConfig; the rebrand landed on 2026-07-27 and
reduced the site to **a single landing page**. The blog, the manual, the talk
decks, and the per-package pages were all removed at that point — do not
reintroduce them without being asked.

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Site generator | Astro | ^6.3.1 |
| Image tooling | sharp | ^0.34.2 |
| Package manager | pnpm | v10.33.2 |
| TypeScript | strict Astro config | via `astro/tsconfigs/strict` |

That is the whole dependency list. MDX (`@astrojs/mdx`), D2 diagrams
(`astro-d2`), and the mdast/micromark packages were dependencies of the blog and
were removed with it. **Tailwind is also gone** — the landing page is styled with
inline attributes, so nothing imported it. If a future page wants Tailwind, add
`tailwindcss` + `@tailwindcss/vite` back, restore the vite plugin in
`astro.config.mjs`, and recreate `src/styles/global.css`.

## Repository Structure

```text
.
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── src/
│   ├── components/
│   │   └── SeoMeta.astro
│   └── pages/
│       ├── blog/
│       │   └── rss.xml.ts
│       ├── index.astro
│       ├── index.md.ts   # markdown twin of the landing page, served at /index.md
│       ├── robots.txt.ts
│       └── sitemap.xml.ts
├── public/
│   ├── fonts/            # 21 self-hosted IBM Plex woff2 files
│   ├── favicon.svg       # the three-stripe mark
│   ├── favicon.png       # raster fallback, currently unreferenced
│   └── og-colors.png     # og:image, generated — see scripts/
├── scripts/
│   └── generate-og-image.py
│
│   # shipping the site — see Deployment
├── Dockerfile            # two stages: node builds, caddy:2-alpine serves dist/
├── Caddyfile.prod        # markdown negotiation, Link headers, 404 → / redirects
├── .dockerignore
├── .github/workflows/
│   └── cicd.yml          # build both arches, stitch a manifest, ssh-ping the server
│
├── Procfile              # local dev only — not copied into the image
├── .envrc                # devenv/direnv toolchain
└── plans/                # design docs and drafts — reference only, never built
    └── colors-landing-page-export.html   # the export index.astro was ported from
```

The image is a two-stage build and carries **no process supervisor**: the
builder stage runs `pnpm build`, and the final stage is stock `caddy:2-alpine`
with `dist/` at `/srv` and `Caddyfile.prod` as its config, on the base image's
own entrypoint. The `Procfile` here is a development convenience (`pnpm install
&& pnpm dev`) and is never copied in — unlike `colors-redirect`, where the
Procfile *is* the production supervisor. Do not add a runtime dependency to this
image expecting hivemind to start it.

`src/`, `public/`, and the four manifests above are the whole site — everything
under `src/pages/` is a route and there are no others. `public/` is small on
purpose: before adding to it, check the new file is actually referenced.
`favicon.png` currently is not — `index.astro` links only `favicon.svg`, so the
PNG ships to `dist/` and is served, but nothing points at it.

`plans/` holds ~46 design documents and LinkedIn drafts accumulated over the
project. None of it is a build input, and it is not maintained alongside the
code — read it as history, not as a description of the current site. The one
file with a live role is the landing-page export, kept as the visual reference.

## Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm astro
```

Always use `pnpm`.

## The landing page

`src/pages/index.astro` is the whole site. It was ported by hand from a bundled
design export, which is kept at `plans/colors-landing-page-export.html` as the
visual reference — that file is **not** built and must stay out of `src/pages/`
(it would publish as a route, and its filename contains spaces).

Things to know before editing it:

- The design is expressed as **inline `style` attributes**, not Tailwind classes.
  Match that when adding sections; don't mix idioms mid-page.
- The colour system is `oklch()` throughout. The three library accents are
  red `oklch(60% 0.19 25)`, green `oklch(65% 0.17 145)`, blue `oklch(55% 0.18 260)`.
- The three libraries are **red = TypeScript/Bun, green = Clojure/Babashka,
  blue = Python/uv**.
- The export shipped **no media queries**. The `@media` blocks at the end of the
  `<style is:global>` are additions, and they need `!important` to beat the
  inline styles. Classes `r-hero`, `r-2`, `r-3`, `r-4` mark the fixed grids.
- Hover states from the export became the `.h1` / `.h2` classes.
- The two "Copy" buttons are driven by `data-copy` and one small inline script
  at the bottom of the page. There is no framework — the page needs no JS to
  render, only to copy.
- Fonts are self-hosted from `public/fonts/`. Do not add a Google Fonts link.
- The hero's `colors.yml` panel is the one exception to "inline styles only": it
  is an `<astro:components>` `Code` block, highlighted by the Shiki that ships
  inside Astro — no dependency was added for it. It renders the **real**
  `colorsYml` that deploys this site, so it and the block under Deployment
  below have to change together.
- `yamlTheme` in the frontmatter is a hand-written Shiki theme, six scopes wide.
  Bundled themes were rejected because each one imports a palette that fights
  the page; this maps keys to blue, values to green and literals to red — the
  three library accents, darkened for contrast at 13px. Shiki emits the theme
  `name` as a class on the `<pre>`, hence `colors-yaml` rather than `colors`.
  It accepts `oklch()` straight through; no hex fallback needed here.
- Shiki's `<pre>`/`<code>` take the UA monospace family instead of inheriting
  the panel's, so `.astro-code` restates IBM Plex Mono in the global block.
  Remove that rule and the hero silently renders in Courier.

## Brand assets

`public/favicon.svg` is the three-stripe mark: a 20×20 rounded square matching
the nav logo in `index.astro`. It uses hex rather than `oklch()` because not
every favicon rasteriser parses modern CSS colour — the oklch originals are in a
comment in the file.

`public/og-colors.png` is the og:image and is **generated**, not hand-drawn. Run
`scripts/generate-og-image.py` to rebuild it after any copy or brand change; the
setup block at the top of that script explains the one-off venv. It converts
text to outlines straight from `public/fonts/`, so the card's type matches the
page and no system fonts are needed, and it warns on stderr if a line overflows
the safe margin.

**Changing the artwork means changing the filename.** Slack, WhatsApp and
LinkedIn cache unfurls keyed on the image URL and hold them for days, so new
bytes at an old path keep showing the old card. Bump the name in both
`scripts/generate-og-image.py` (`OUT`) and `SeoMeta.astro` (`DEFAULT_IMAGE`).
The file was called `linkedin.png` under BigConfig; that name is retired.

## Testing a link unfurl before deploying

`og:image` and `canonical` are absolute URLs built from `site` in
`astro.config.mjs`, so a preview host serving a normal build still tells Slack
to fetch the image from production — and you see whatever production has today,
not your change. Build with the preview host instead:

```bash
SITE_URL=https://<preview-host> pnpm build
```

Production is unaffected: the Dockerfile runs a bare `pnpm build`, so `SITE_URL`
is unset and `site` falls back to the real domain. Do not commit a `dist/` built
this way.

Note the script synthesises the headline's semibold by stroking the outline —
`public/fonts/` only carries IBM Plex **Sans 400**. The page has the same gap and
lets the browser fake it. If you ever add a real Sans 600 woff2, drop the
`weight=` arguments and update the `@font-face` block in `index.astro`.

## RSS

`src/pages/blog/rss.xml.ts` survives the blog's deletion on purpose. It serves a
valid, **empty** RSS 2.0 channel at `/blog/rss.xml` so existing subscribers keep
the subscription rather than their reader dropping a 404 feed. It has no
dependencies and no items.

## Agent and crawler discovery

Three routes exist for machine readers. All three are **generated endpoints**,
not static files in `public/`, because each one embeds the site host and has to
follow `SITE_URL` the same way `canonical` and `og:image` do. A static
`public/robots.txt` would hardcode production into every preview build.

| Route | Source | Notes |
|---|---|---|
| `/sitemap.xml` | `src/pages/sitemap.xml.ts` | one `<url>`, `/`. `lastmod` is the build time — there is no per-route publish date to use. |
| `/robots.txt` | `src/pages/robots.txt.ts` | `Allow: /` plus the absolute `Sitemap:` line. |
| `/index.md` | `src/pages/index.md.ts` | markdown rendition of the landing page. |

`@astrojs/sitemap` would cover the first one, but it is a dependency for a
single page; add the route to `PAGES` in `sitemap.xml.ts` when a second page
appears, and reach for the integration when that list stops being trivial.

**The markdown copy is duplicated by hand.** `index.md.ts` mirrors the prose in
`index.astro`; there is no shared source, because the landing page is an
inline-styled port of a design export and extracting its strings would mean
rewriting it. Edit both together.

Caddy does the content negotiation — Astro builds static files and cannot vary
on a request header. The `@markdown` matcher in `Caddyfile.prod` catches
`Accept: text/markdown` on `/` and rewrites to `/index.md`; browsers send
`Accept: text/html` and curl sends `*/*`, so HTML stays the default. Both
responses send `Vary: Accept` so a cache cannot serve one to the other.

The same file adds RFC 8288 `Link` headers on the homepage only: `canonical`,
the `alternate` markdown twin, the `sitemap`, and `author`. They are **relative
URI-references** on purpose, resolved by the client against the request URL, so
the domain is not spelled out a fifth time.

After touching any of this, test it against a real Caddy — see the recipe under
Redirects, then:

```bash
curl -sI -H 'Accept: text/markdown' localhost:4321/   # text/markdown + Vary
curl -sI localhost:4321/ | grep -i '^link'            # four Link headers
```

### What is deliberately not published

An agent-readiness scan will also ask for `/.well-known/api-catalog`,
`/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource`,
`/auth.md`, `/.well-known/mcp/server-card.json`, an agent-skills index, and
WebMCP tools via `navigator.modelContext`. **This site has no API, no auth, no
MCP server and no tools** — it is one marketing page. Those documents would have
to be invented, and a catalog advertising endpoints that do not answer is worse
for an agent than no catalog. Do not add them to make a scanner green. If Colors
later ships a real API, the catalog goes in then.

DNS-AID records (`_index._agents.getcolors.ai`) are DNS, not files: they live in
Cloudflare with the rest of the zone, which this repo does not manage.

## Redirects

There is no `redirects` map in `astro.config.mjs` and no 404 page. Caddy handles
it: the `handle_errors` block in `Caddyfile.prod` 301s **any** 404 to `/`. That
covers every retired URL — the 44 blog posts, `/manual`, `/once`, `/walter`,
`/clickhouse`, `/marketplace`, `/package-spec`, the eight `/talk/*` decks, and
the old `/api/*` and `/libraries/*` docs routes — without enumerating them.

`/blog/rss.xml` is a real file, so `file_server` serves it and the redirect never
fires for it. `/up` is matched earlier and stays a 200 for the healthcheck.

**Gotcha, verified the hard way:** the matcher has to sit on `redir` itself.
Writing it as `handle @notFound { redir / 301 }` passes `caddy validate` and then
serves a bare 404 with no `Location` header. Do not "tidy" it back into a
`handle` block. After changing `Caddyfile.prod`, test it for real:

```bash
pnpm build
sed -e 's|^:80 {|:4321 {|' -e "s|root \* /srv|root * $PWD/dist|" \
  Caddyfile.prod > /tmp/Caddyfile.local
caddy run --config /tmp/Caddyfile.local --adapter caddyfile &
curl -sI localhost:4321/manual | head -2   # expect 301 + Location: /
```

## Deployment

The site is deployed by ONCE, the Package Skill built with Colors. The config
that describes the host is a `colors.yml` — **it is not checked into this
repo**; it lives with the infrastructure. Reproduced here because several values
in `.github/workflows/cicd.yml` only make sense against it:

```yaml
profile: once-colors
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
compute-prevent-destroy: true
```

What ties to what:

- `profile: once-colors` is the name of the **GitHub Environment** the deploy
  job declares (`environment.name` in `cicd.yml`, and the `deploy-once-colors`
  concurrency group beside it). Get it wrong and the environment-scoped
  `SSH_PRIVATE_KEY` and the `SERVER_*` vars all resolve to empty — the job does
  not fail loudly, it fails confusingly. The profile was `colors-website` until
  2026-07-28; that name was right for one repo and confusing in the other.
- `image:` is `ghcr.io/${{ github.repository }}:latest` as pushed by the
  `manifest` job, so this repo has to live at **`getcolors/colors-website`** for
  the tag to line up.
- The deploy step names **no host at all** — it is a bare `ssh -T` ping. The
  key's `authorized_keys` entry carries a forced command that updates every host
  it owns, so adding an application here needs no change to `cicd.yml`. It
  connects to `SERVER_IP`, not a hostname: ONCE pins `SSH_KNOWN_HOSTS` on the
  address, and under `StrictHostKeyChecking=yes` a hostname finds no match.
- The apex `getcolors.ai` is **no longer an application in this profile** — it
  was a second entry serving a redirect image from `getcolors/colors-redirect`
  until the config above dropped it. The apex still 301s to `www` (verified
  2026-07-29), from the edge or from a deployment this repo has no part in
  either way. Nothing here builds or serves it; don't add apex handling to
  `Caddyfile.prod`.
- `compute-prevent-destroy: true` means the compute instance is protected — a
  `once destroy` will refuse. Flipping it to `false` is how you would tear the
  server down, so don't do it casually.

**The domain is spelled out in four places and they must agree.** `site` in
`astro.config.mjs` is the source of truth for `canonical` and `og:image`; the
other three are independent literals that no build step cross-checks:

| File | What it is |
|---|---|
| `astro.config.mjs` | `site` — the `SITE_URL` fallback, feeds `Astro.site` |
| `src/components/SeoMeta.astro` | fallback if `Astro.site` is somehow unset |
| `src/pages/blog/rss.xml.ts` | the `<link>` in the empty feed |
| `README.md` | prose |

All four were `https://www.bigconfig.ai` until 2026-07-28, when they were
repointed to `https://www.getcolors.ai` to match the deploy host. The old domain
had been left behind by the rebrand, so every `canonical` and `og:image` on the
live site advertised a host the site was no longer served from.

No og:image rename was needed for that switch: the image URL's **host** changed,
so it is a new URL to Slack and LinkedIn and their caches never collided. The
rename rule above still applies to changing the artwork at a fixed host.

## Notes

- `dist/` is generated by `pnpm build`.
- Do not edit `pnpm-lock.yaml` manually.
- Google Analytics ID: `G-4VKP1WY4QJ`.
- Site URL: `https://www.getcolors.ai`, matching the deploy host. It is written
  in four files — see the table under Deployment; change them together.
- The install command on the page is `npx skills use getcolors/once`. It appears
  **four times** in `index.astro` — the visible `<code>` and the `data-copy`
  attribute of each of the two copy blocks. Change all four together or the
  button copies something the page does not show. It appears **twice more** in
  `src/pages/index.md.ts`, the markdown twin: six in total.
- The three library links are `github.com/getcolors/red|green|blue`, and the
  footer links to the org root `github.com/getcolors`. These shipped from the
  design export as `bigconfig-ai/once` and `amiorin/red|green|blue`; they were
  repointed to the `getcolors` org on 2026-07-28.
