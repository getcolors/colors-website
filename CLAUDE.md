# CLAUDE.md - AI Assistant Guide

## Project Overview

This is the static website for Colors, an SDK for building Package Skills. The
product was previously called BigConfig. `/` remains the landing page;
`/featured` is the editorial showcase and `/skills` plus the generated
owner/source/Package Skill routes form the PR-curated Skills Catalog (Package Skills and Context Skills).
The blog is live again at `/blog` with ten articles; the manual and talk
decks remain retired.

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Site generator | Astro | ^7.1.6 |
| Image tooling | sharp | ^0.35.3 |
| Package manager | pnpm | v10.33.2 |
| Typechecker | `@astrojs/check` + typescript | ^0.9.10 / ^6 (dev only) |
| TypeScript | strict Astro config | via `astro/tsconfigs/strict` |

The catalog also uses `yaml` for PR-submitted recipes and `marked` to render
the referenced public `SKILL.md` bodies. MDX (`@astrojs/mdx`) and D2 diagrams
(`astro-d2`) remain removed with the blog. **Tailwind is also gone** — routes
use local Astro styles and the catalog shares `CatalogLayout.astro`. If a future page wants
Tailwind, add `tailwindcss` + `@tailwindcss/vite` back, restore the vite plugin
in `astro.config.mjs`, and recreate `src/styles/global.css`.

TypeScript is pinned to **^6** even though 7 is released: `@astrojs/check`
declares a `^5 || ^6` peer range, and installing 7 leaves it unmet. Bump it when
that package widens the range, not before.

## Repository Structure

```text
.
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── recipes/              # one PR-curated YAML recipe per Package Skill product
│   └── *.yml             # or per Context Skill (`type: context`)
├── src/
│   ├── components/       # shared header, SEO, breadcrumbs, install box and catalog lists
│   ├── data/
│   │   ├── landing.ts    # every string on the landing page
│   │   └── catalog.ts    # recipes, source metadata, skills.sh counts
│   ├── layouts/
│   │   └── CatalogLayout.astro
│   └── pages/
│       ├── [owner]/      # generated owner/repository/skill routes
│       ├── blog/         # /blog index, rss.xml, and the article pages
│       ├── featured/index.astro
│       ├── skills/index.astro
│       ├── index.astro
│       ├── index.md.ts
│       ├── robots.txt.ts
│       └── sitemap.xml.ts
├── public/
│   ├── fonts/            # 21 self-hosted IBM Plex woff2 files
│   ├── favicon.svg       # the three-stripe mark
│   ├── favicon.png       # raster fallback, currently unreferenced
│   ├── og-colors-v2.png  # og:image, generated — see scripts/
│   └── .well-known/
│       └── agent-skills/ # generated discovery index and skill artifacts
├── scripts/
│   ├── agent-skills.json # upstream repositories, SHA pins, and skill paths
│   ├── generate-agent-skills.mjs
│   └── generate-og-image.py
├── index.html            # GitHub Pages repository landing page; not an Astro input
├── .nojekyll             # lets GitHub Pages publish that root landing page verbatim
│
│   # shipping the site — see Deployment
├── Dockerfile            # two stages: node builds, caddy:2-alpine serves dist/
├── Caddyfile.prod        # markdown negotiation, Link headers, 404 → / redirects
├── .dockerignore
├── .github/workflows/
│   ├── cicd.yml          # typecheck, build both arches, stitch a manifest, ssh-ping the server
│   └── update-agent-skills.yml # weekly grouped skill-update PR
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

`src/`, `recipes/`, `public/`, and the manifests above are the whole production
site. Everything under `src/pages/` is a route. The root `index.html` and
`.nojekyll` belong only to the GitHub Pages repository landing
page: they are not Astro inputs, do not enter `dist/`, and must not duplicate the
production homepage. `public/` is small on purpose: before adding to it, check
the new file is actually referenced. `favicon.png` currently is not —
`index.astro` links only `favicon.svg`, so the PNG ships to `dist/` and is
served, but nothing points at it.

`plans/` holds ~46 design documents and LinkedIn drafts accumulated over the
project. None of it is a build input, and it is not maintained alongside the
code — read it as history, not as a description of the current site. The one
file with a live role is the landing-page export, kept as the visual reference.

## Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm typecheck        # astro check — the gate CI runs before it builds an image
pnpm skills:generate  # rebuild artifacts and index from the committed SHA pins
pnpm skills:update    # move pins to upstream main, then rebuild artifacts and index
pnpm astro
```

Always use `pnpm`.

## The landing page

`src/pages/index.astro` is the SDK landing page. It was ported by hand from a
bundled design export, which is kept at `plans/colors-landing-page-export.html` as the
visual reference — that file is **not** built and must stay out of `src/pages/`
(it would publish as a route, and its filename contains spaces).

**Shared landing copy lives in `src/data/landing.ts`, markup and style in
`index.astro`.** Both the HTML page and `/index.md` twin consume its product
copy and canonical Package Skill definition. Keep their final Catalog CTA in
sync when changing it.

Things to know before editing it:

- The design was **inline `style` attributes** when it landed, ported that way
  from the export. It is now one `<style is:global>` block of classes; the two
  remaining `style=` attributes are genuinely per-instance (the Shiki `Code`
  prop, and each library card's accent swatch). Add rules to the stylesheet
  rather than reaching for an attribute.
- Repeated blocks are rendered from arrays — three library cards, three
  bundles, and the Create/Submit Package Skill phases. Featured Package Skills no
  longer appear on `/`; they live on `/featured` and in the Catalog.
  Adding a library means adding an object to `libraries.items`, not copying
  markup.
- The colour system is `oklch()` throughout, declared once as custom properties
  on `:root`. The three library accents are `--red oklch(60% 0.19 25)`,
  `--green oklch(65% 0.17 145)`, `--blue oklch(55% 0.18 260)`.
- The three libraries are **red = TypeScript/Bun, green = Clojure/Babashka,
  blue = Python/uv**.
- The export shipped **no media queries**. The `@media` blocks at the end of the
  stylesheet are additions. They used to need `!important` to beat the inline
  styles and **no longer do** — ordinary cascade order settles it, so they have
  to stay last in the block. Classes `hero`, `grid-2`, `grid-3`, `grid-4` mark
  the fixed grids (formerly `r-hero`, `r-2`, `r-3`, `r-4`).
- `.yml { min-width: 0 }` inside the 860px block is load-bearing, not tidying.
  Once the hero collapses to one column the panel's automatic minimum size is
  the longest unwrapped line of `colors.yml`, which widens the whole document
  and pushes every section's right padding off screen. The panel was
  `.yaml-panel` when that fix landed in `aa84d3d`; renaming a class here means
  checking the media queries, since a stale selector fails silently.
- One media rule is written as `.install-row code, .astro-code, .astro-code code`
  rather than a bare `code`. A bare `code` selector loses to `.install-row code`
  on specificity now that the 14px is a class rule; the old `code { ... }`
  worked only because it carried `!important`.
- Hover states from the export are `.copy:hover` and `.lib:hover` (formerly the
  `.h1` / `.h2` classes).
- Section labels ("STEP 01", "BROWSER SKILL") are stored **title-case** in
  `landing.ts` and uppercased with `text-transform`, so the markdown twin reads
  as prose rather than shouting.
- Every "Copy" button is driven by `data-copy` and one small inline script at
  the bottom of the page. There is no framework — the page needs no JS to
  render, only to copy.
- Fonts are self-hosted from `public/fonts/`. Do not add a Google Fonts link.
  The 39 `@font-face` rules are the bulk of the file; Astro extracts the whole
  `<style is:global>` to a hashed stylesheet at build time, so its size costs a
  request either way.
- The hero's `colors.yml` panel is an `<astro:components>` `Code` block,
  highlighted by the Shiki that ships inside Astro — no dependency was added
  for it. It renders the **real** `colorsYml` that deploys this site, so it and
  the block under Deployment below have to change together. The twin fences the
  same constant, so that is now one edit rather than three.
- `yamlTheme` in the frontmatter is a hand-written Shiki theme, six scopes wide.
  Bundled themes were rejected because each one imports a palette that fights
  the page; this maps keys to blue, values to green and literals to red — the
  three library accents, darkened for contrast at 13px. Shiki emits the theme
  `name` as a class on the `<pre>`, hence `colors-yaml` rather than `colors`.
  It accepts `oklch()` straight through; no hex fallback needed here.
- Shiki's `<pre>`/`<code>` take the UA monospace family instead of inheriting
  the panel's, so `.astro-code` restates IBM Plex Mono in the global block.
  Remove that rule and the hero silently renders in Courier.

## The Skills Catalog

`recipes/*.yml` is the admission boundary. A community PR adds one product
recipe and groups its red/green/blue variants under `package-skills`; merging
adds discoverability only. GitHub remains the source and `npx skills` remains
the installer. Do not add artifact building or hosting.

`src/data/catalog.ts` validates recipes, fetches each public `SKILL.md`, renders
its body with raw HTML escaped, and fetches only the installation count from the
matching skills.sh URL. A missing skills.sh page means zero installs and must
not fail a build; a missing or mismatched `SKILL.md` must fail it. Catalog
copy never comes from skills.sh.

Recipes carry an optional `type:` — `package` (the default) or `context`. A
Context Skill is distilled knowledge from a verified build, defined
normatively by the workspace's `standards/context-skill.md`; its recipe lists
`context-skills` entries instead of `package-skills` (no runtimes, no
`package-` prefix) and may name a `companion:` product repository, rendered
as a link in both directions. Context Skills are loaded with
`npx skills use`, never installed — their pages pass `rewrite={false}` to
`InstallBox` so the Command tab does not rewrite `use` to `add`. On `/skills`
they render as a separate section below the Package Skill cards, covered by
the same search.

The generated hierarchy is `/skills`, `/{owner}`,
`/{owner}/{repository}`, and `/{owner}/{repository}/{skill}` for both skill
kinds. **Several recipes may share one repository** — every Context Skill
lives in `getcolors/skills` — so `loadCatalog()` groups recipes into
`repositories`, and source pages, owner pages, `sitemap.xml.ts`, and the
og-image generator all enumerate repositories, not recipes. Generating those
routes from sources would emit duplicate paths the moment a second context
skill lands. The
editorial `/featured` showcase is separate. Catalog recipes may link to
a showcase anchor through maintainer-controlled `featured` metadata; catalog
pages and the showcase link to each other. `sitemap.xml.ts` enumerates all of
these routes from `loadCatalog()`.

## Brand assets

`public/favicon.svg` is the three-stripe mark: a 20×20 rounded square used by
both the browser favicon and the shared `SiteHeader.astro` on every HTML page.
The shared header imports the one `nav` array from `landing.ts`; never fork its
markup or navigation links in a page or layout. The SVG uses hex rather than
`oklch()` because not
every favicon rasteriser parses modern CSS colour — the oklch originals are in a
comment in the file.

The files under `public/og-*.png` are generated, not hand-drawn. Run
`scripts/generate-og-image.py` to rebuild them after any copy, recipe, or brand
change. **The build now fails if a referenced card is missing from `public/`** —
`requireLocalImage()` in `src/data/og-image.ts`, called from `SeoMeta`. That
guard exists because 22 catalog cards were referenced by built pages and had
never been generated, so those unfurls fetched a 404 for as long as the recipes
had existed: nothing broke at build time, so nobody noticed. The setup block at the top of that script
explains the one-off Python environment. In addition to the landing card, the script creates blue cards for
`/featured`, `/skills`, and every owner, source, and Package Skill route from
the recipes. `catalogOgImage()` in `src/data/catalog.ts` must keep the same
filename convention. The generator converts text to outlines straight from
`public/fonts/`, so the cards match the site's typography without system fonts,
and warns on stderr if a line overflows the safe margin.

**Changing the artwork means changing the filename.** Slack, WhatsApp and
LinkedIn cache unfurls keyed on the image URL and hold them for days, so new
bytes at an old path keep showing the old card. Bump the name in both
`scripts/generate-og-image.py` (`OUT`) and `SeoMeta.astro` (`DEFAULT_IMAGE`).
The file was called `linkedin.png` under BigConfig; that name is retired. So is
`og-colors.png`, removed on 2026-07-30 — it was generated from the pre-rebrand
`CMD` and showed `npx skills use bigconfig-ai/once` on every unfurl for three
days while the page itself said `getcolors/once`.

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

## The blog

`/blog` and ten articles under `src/pages/blog/` are live. **`src/data/blog.ts`
is the one list of them**, and `/blog`, `/blog/rss.xml` and `sitemap.xml.ts` all
read it.

That module exists because the list used to be kept in three places and only the
index was maintained: both articles published on 2026-08-17 were linked from
`/blog` while missing from the feed *and* the sitemap — visible to a reader,
invisible to a crawler or a subscriber. Adding an article is one entry in
`blog.ts` plus the page itself.

`isoDate` there is the only machine-readable date, and it must agree with
`datePublished` in the article's own structured data; nothing cross-checks them.

Each article page owns its `image`/`imageAlt`, which are the **social card**,
not the in-article figure. The card must genuinely be 1200x630, because
`SeoMeta` declares those dimensions for every page: two articles shipped a
1376x768 body diagram and scrapers cropped them. Cards are generated by
`scripts/generate-og-image.py` — `render_article_card` for the analytics
benchmark's bespoke one, `render_post_card` for the rest.

Article pages build their structured-data URLs with `new URL(target, SITE_URL)`
against `Astro.site`, exactly as `SeoMeta` does. They previously hardcoded the
production host as string literals, so a `SITE_URL=` preview build repointed
`og:image` and `canonical` while the JSON-LD kept advertising production.

## Agent and crawler discovery

Three routes exist for machine readers. All three are **generated endpoints**,
not static files in `public/`, because each one embeds the site host and has to
follow `SITE_URL` the same way `canonical` and `og:image` do. A static
`public/robots.txt` would hardcode production into every preview build.

| Route | Source | Notes |
|---|---|---|
| `/sitemap.xml` | `src/pages/sitemap.xml.ts` | landing, showcase and every generated catalog route. `lastmod` is the build time. |
| `/robots.txt` | `src/pages/robots.txt.ts` | `Allow: /` plus the absolute `Sitemap:` line. |
| `/index.md` | `src/pages/index.md.ts` | markdown rendition of the landing page. |

`sitemap.xml.ts` reads the same catalog module as the pages, so a merged
recipe automatically adds its owner, source and Package Skill URLs.

**The markdown copy is generated, not duplicated.** `index.md.ts` and
`index.astro` both render `src/data/landing.ts`, so a wording change reaches
both by construction. Edit the data module; neither route holds prose of its
own.

It was two hand-maintained copies until 2026-07-30, on the reasoning that the
page was an inline-styled port and extracting its strings meant rewriting it.
That was true, and the rewrite happened — but only after the copies had drifted
twice. `b761193` put the real `colors.yml` in the hero and left the twin
documenting a `host:`/`apps:` schema the product does not accept, which is a
worse failure than a stale sentence: agents read the twin *as the reference*.

Two consequences worth knowing:

- Prose in `landing.ts` is authored in **markdown**, because the twin consumes
  it verbatim. `index.astro` calls `html()` from that module, which strips code
  ticks and turns `**bold**` into `<strong>`. It is two regexes, not a markdown
  parser — don't reach for syntax it doesn't handle.
- The twin hard-wraps at 78 columns through a `wrap()` helper that treats a
  `` `code span` `` as unbreakable. Fences and the library table are never
  wrapped, where a break would change meaning.

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
`/auth.md`, `/.well-known/mcp/server-card.json`, and WebMCP tools via
`navigator.modelContext`. **This site has no API, no auth, no MCP server and no
tools** — it is one marketing page. Those documents would have to be invented,
and a catalog advertising endpoints that do not answer is worse for an agent
than no catalog. Do not add them to make a scanner green. If Colors later ships
a real API, the catalog goes in then.

The exception is `/.well-known/agent-skills/index.json`: the landing page lists
real Agent Skills, including Package Skills that reconcile infrastructure to
desired state. `scripts/generate-agent-skills.mjs` fetches their source
repositories at the explicit SHAs in `scripts/agent-skills.json`, extracts name
and description from each `SKILL.md`, and emits the v0.2.0 discovery index.
Package Skills include supporting files and launchers, so they are deterministic
`.tar.gz` archives; the self-contained Create Package Skill is a `skill-md`.
Every URL is content-addressed and every entry carries its SHA-256 digest. Never
edit `public/.well-known/agent-skills/` directly. A Monday workflow checks
upstream `main` branches and opens one grouped PR containing pin and artifact
updates.

DNS-AID records (`_index._agents.getcolors.ai`) are DNS, not files: they live in
Cloudflare with the rest of the zone, which this repo does not manage.

## Redirects

There is no `redirects` map in `astro.config.mjs` and no 404 page. Caddy handles
it: the `handle_errors` block in `Caddyfile.prod` 301s **any** 404 to `/`. That
covers every retired URL — the 44 old blog posts (the ten current articles are
real routes and are unaffected), `/manual`, `/once`, `/walter`,
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

- The `check` job runs `pnpm typecheck` and **`build` needs it**, so a type
  error costs one job rather than two image builds, a manifest push and an SSH
  deploy. It is the only gate in the pipeline: there are no tests, no linter and
  no formatter, and `pnpm build` does not typecheck on its own. Added
  2026-07-30 — before that a push went to production uninspected.
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

**The domain must agree everywhere it is written.** `site` in
`astro.config.mjs` is the source of truth for `canonical` and `og:image`; the
rest are independent literals that no build step cross-checks:

| File | What it is |
|---|---|
| `astro.config.mjs` | `site` — the `SITE_URL` fallback, feeds `Astro.site` |
| `src/components/SeoMeta.astro` | fallback if `Astro.site` is somehow unset |
| `src/pages/blog/*.astro` | the same fallback, once per article |
| `README.md` | prose |

`sitemap.xml.ts` and `blog/rss.xml.ts` deliberately have **no** fallback: they
throw when `site` is unset, because a sitemap or feed full of wrong-host URLs is
worse than a failed build.

All were `https://www.bigconfig.ai` until 2026-07-28, when they were
repointed to `https://www.getcolors.ai` to match the deploy host. The old domain
had been left behind by the rebrand, so every `canonical` and `og:image` on the
live site advertised a host the site was no longer served from.

No og:image rename was needed for that switch: the image URL's **host** changed,
so it is a new URL to Slack and LinkedIn and their caches never collided. The
rename rule above still applies to changing the artwork at a fixed host.

## Notes

- `dist/` is generated by `pnpm build`.
- Do not edit `pnpm-lock.yaml` manually.
- Analytics is two tags that always ship together: GA4 ID `G-4VKP1WY4QJ`, and
  the self-hosted Rybbit snippet `https://rybbit.getcolors.ai/api/script.js`
  with `data-site-id="9fb9c41a6d49"`. Rybbit shares that one site ID across
  every getcolors page. Both are written in three files —
  `src/pages/index.astro`, `src/pages/featured/index.astro`, and
  `src/layouts/CatalogLayout.astro`, which every blog and catalog page
  inherits; change them together, and never add one tag without the other.
  The repository's own root `index.html` carries its own copy of both.
- Site URL: `https://www.getcolors.ai`, matching the deploy host. It is written
  in four files — see the table under Deployment; change them together.
- The main Once command is `npx skills use getcolors/once`. It is written **twice**
  in the repository: `installCmd` in `src/data/landing.ts`, which every on-page
  occurrence and the markdown twin resolve to, and `CMD` in
  `scripts/generate-og-image.py`, which bakes it into the og:image. It was six
  hand-kept copies until 2026-07-30.

  Create Package Skill has its own command,
  `npx skills use getcolors/skills@create-package-skill`, in `landing.ts`. It is
  an Agent Skill fetched for the agent's next request, not a Package Skill
  installed into a deployment.

  The second Once copy is the one that bites. It is not on any page, so it does not
  show up when you grep the rendered site, no build step reads it, and a wrong
  value there ships a social card contradicting the page — which is exactly what
  happened between 2026-07-27 and 2026-07-30, when every unfurl advertised
  `bigconfig-ai/once`. Changing the command means changing both, regenerating
  the card, and renaming it.
- The three library links are `github.com/getcolors/red|green|blue`, and the
  footer links to the org root `github.com/getcolors`. These shipped from the
  design export as `bigconfig-ai/once` and `amiorin/red|green|blue`; they were
  repointed to the `getcolors` org on 2026-07-28.
