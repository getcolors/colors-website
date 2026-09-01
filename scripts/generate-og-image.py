#!/usr/bin/env python3
"""Regenerate the site's og:image (see OUT below for the current filename).

All text is converted to vector outlines from the same IBM Plex woff2 files in
public/fonts/ that the site serves, so the card matches the page's typography
exactly and needs no system fonts installed.

Setup and run (fontTools is not a project dependency; keep it in a throwaway
venv rather than adding Python to the site's toolchain):

    uv venv /tmp/ogvenv
    uv pip install --python /tmp/ogvenv/bin/python fonttools brotli
    /tmp/ogvenv/bin/python scripts/generate-og-image.py

Rasterisation shells out to node + sharp, which is already a dependency.
The script prints a warning if any text run overflows the safe margin.
"""
import glob
import math
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "public", "fonts")
# Keep this in sync with DEFAULT_IMAGE in src/components/SeoMeta.astro. If you
# change the artwork, change the filename too — Slack, WhatsApp and LinkedIn
# cache unfurls by image URL, so new bytes at an old path show the old card.
# og-colors.png was retired on 2026-07-30: it was generated before the rebrand
# landed in CMD below and shipped a card reading "bigconfig-ai/once".
OUT = os.path.join(ROOT, "public", "og-colors-v2.png")

try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.misc.transform import Transform
except ImportError:
    sys.exit("fontTools is missing — see the setup block at the top of this file.")

W, H = 1200, 630          # 1.91:1, the og:image / LinkedIn standard
MARGIN = 80


def oklch(L, C, Hdeg):
    """Convert the page's oklch() values to sRGB hex."""
    a = C * math.cos(math.radians(Hdeg))
    b = C * math.sin(math.radians(Hdeg))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_**3, m_**3, s_**3
    lin = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ]
    out = []
    for c in lin:
        c = max(0.0, min(1.0, c))
        c = 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
        out.append(round(max(0.0, min(1.0, c)) * 255))
    return "#%02x%02x%02x" % tuple(out)


BG = oklch(0.99, 0.002, 90)
INK = oklch(0.20, 0.01, 260)
MUTED = oklch(0.45, 0.01, 260)
ONDARK = oklch(0.96, 0.005, 260)
RED = oklch(0.60, 0.19, 25)
GREEN = oklch(0.65, 0.17, 145)
BLUE = oklch(0.55, 0.18, 260)

SANS = "ibm-plex-sans-400-latin"
MONO5 = "ibm-plex-mono-500-latin"
MONO6 = "ibm-plex-mono-600-latin"

_fonts = {}
_warnings = []


def font(name):
    if name not in _fonts:
        _fonts[name] = TTFont(os.path.join(FONTS, name + ".woff2"))
    return _fonts[name]


def text(fname, s, size, tracking=0.0):
    """Return (svg path data, advance width), baseline at y=0."""
    f = font(fname)
    scale = size / f["head"].unitsPerEm
    cmap, glyphs, hmtx = f.getBestCmap(), f.getGlyphSet(), f["hmtx"]
    x, parts = 0.0, []
    for ch in s:
        gname = cmap.get(ord(ch))
        if gname is None:
            _warnings.append(f"missing glyph {ch!r} in {fname}")
            x += size * 0.5
            continue
        pen = SVGPathPen(glyphs)
        glyphs[gname].draw(TransformPen(pen, Transform(scale, 0, 0, -scale, x, 0)))
        if pen.getCommands():
            parts.append(pen.getCommands())
        x += hmtx[gname][0] * scale + tracking * size
    return " ".join(parts), x


def draw(fname, s, size, x, y, fill, tracking=0.0, weight=0.0):
    """weight > 0 strokes the outline to synthesise a heavier cut.

    public/fonts only carries IBM Plex Sans at weight 400, so the headline's
    semibold look is approximated rather than loaded.
    """
    d, w = text(fname, s, size, tracking)
    if x + w > W - MARGIN:
        _warnings.append(f"{s[:28]!r} overflows the right margin by {x + w - (W - MARGIN):.0f}px")
    stroke = (
        f' stroke="{fill}" stroke-width="{weight * size:.3f}" stroke-linejoin="round"'
        if weight
        else ""
    )
    return f'<path d="{d}" transform="translate({x:.2f},{y:.2f})" fill="{fill}"{stroke}/>', w


o = [f'<rect width="{W}" height="{H}" fill="{BG}"/>']

# Brand mark + wordmark. Same 4-on-20 corner radius as public/favicon.svg.
MARK, MX, MY = 60, MARGIN, 64
o.append(f'<clipPath id="m"><rect x="{MX}" y="{MY}" width="{MARK}" height="{MARK}" rx="{MARK * 0.2}"/></clipPath>')
o.append('<g clip-path="url(#m)">')
o.append(f'<rect x="{MX}" y="{MY}" width="{MARK}" height="{MARK}" fill="{GREEN}"/>')
o.append(f'<rect x="{MX}" y="{MY}" width="{MARK / 3:.3f}" height="{MARK}" fill="{RED}"/>')
o.append(f'<rect x="{MX + 2 * MARK / 3:.3f}" y="{MY}" width="{MARK / 3:.3f}" height="{MARK}" fill="{BLUE}"/>')
o.append("</g>")
o.append(draw(SANS, "Colors", 38, MX + MARK + 20, MY + MARK * 0.72, INK, -0.01, 0.022)[0])

# Headline.
o.append(draw(SANS, "An SDK for building", 78, MARGIN, 300, INK, -0.02, 0.024)[0])
o.append(draw(SANS, "Package Skills", 78, MARGIN, 384, INK, -0.02, 0.024)[0])

# Subline.
o.append(draw(SANS, "Dry-run guarantees, secret indirection and strict lifecycle", 27, MARGIN, 452, MUTED)[0])
o.append(draw(SANS, "control over real infrastructure.", 27, MARGIN, 488, MUTED)[0])

# The three libraries, right column — beside the headline, above the subline.
libraries = [
    ("red", RED, "TypeScript / Bun"),
    ("green", GREEN, "Clojure / Babashka"),
    ("blue", BLUE, "Python / uv"),
]
CX = 790
STACK_X = CX + max(text(MONO6, n, 22)[1] for n, _, _ in libraries) + 18
for i, (name, colour, stack) in enumerate(libraries):
    y = 268 + i * 56
    o.append(draw(MONO6, name, 22, CX, y, colour)[0])
    o.append(draw(MONO5, stack, 19, STACK_X, y, MUTED)[0])

# Install command, in the same dark pill the page uses.
CMD = "npx skills use getcolors/once"
cmd_w = text(MONO5, CMD, 24)[1]
PILL_Y, PILL_H, PAD = 516, 60, 26
o.append(f'<rect x="{MARGIN}" y="{PILL_Y}" width="{cmd_w + 2 * PAD:.1f}" height="{PILL_H}" rx="10" fill="{INK}"/>')
o.append(draw(MONO5, CMD, 24, MARGIN + PAD, PILL_Y + 39, ONDARK)[0])

# Bottom colour band.
BAND = 16
for i, colour in enumerate((RED, GREEN, BLUE)):
    o.append(f'<rect x="{i * W / 3:.3f}" y="{H - BAND}" width="{W / 3:.3f}" height="{BAND}" fill="{colour}"/>')

svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(o)}</svg>'

with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as fh:
    fh.write(svg)
    svg_path = fh.name
try:
    subprocess.run(
        [
            "node",
            "-e",
            f"require('sharp')({svg_path!r},{{density:144}}).resize({W},{H})"
            f".png({{compressionLevel:9}}).toFile({OUT!r}).then(i=>console.log('wrote',i.width+'x'+i.height))",
        ],
        cwd=ROOT,
        check=True,
    )
finally:
    os.unlink(svg_path)


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def wrapped(value, size, max_width, max_lines=2, tracking=0.0):
    words, lines, index = value.split(), [], 0
    while index < len(words) and len(lines) < max_lines:
        current = ""
        while index < len(words):
            candidate = f"{current} {words[index]}".strip()
            if current and text(SANS, candidate, size, tracking)[1] > max_width:
                break
            current = candidate
            index += 1
        if len(lines) == max_lines - 1 and index < len(words):
            candidate = " ".join([current, *words[index:]]).strip().rstrip(".,;:")
            while text(SANS, candidate + "...", size, tracking)[1] > max_width and " " in candidate:
                candidate = candidate.rsplit(" ", 1)[0].rstrip(".,;:")
            current = candidate + "..."
            index = len(words)
        lines.append(current)
    return lines


def render_blue_card(filename, kicker, title, subtitle, route):
    card = [f'<rect width="{W}" height="{H}" fill="{BG}"/>']
    card.append(f'<rect x="0" y="0" width="18" height="{H}" fill="{BLUE}"/>')

    card.append(f'<clipPath id="mark"><rect x="{MARGIN}" y="64" width="{MARK}" height="{MARK}" rx="{MARK * 0.2}"/></clipPath>')
    card.append('<g clip-path="url(#mark)">')
    card.append(f'<rect x="{MARGIN}" y="64" width="{MARK}" height="{MARK}" fill="{GREEN}"/>')
    card.append(f'<rect x="{MARGIN}" y="64" width="{MARK / 3:.3f}" height="{MARK}" fill="{RED}"/>')
    card.append(f'<rect x="{MARGIN + 2 * MARK / 3:.3f}" y="64" width="{MARK / 3:.3f}" height="{MARK}" fill="{BLUE}"/>')
    card.append('</g>')
    card.append(draw(SANS, "Colors", 38, MARGIN + MARK + 20, 107, INK, -0.01, 0.022)[0])

    kicker_path, kicker_width = draw(MONO6, kicker.upper(), 17, MARGIN + 18, 187, BLUE, 0.03)
    card.append(f'<rect x="{MARGIN}" y="153" width="{kicker_width + 36:.1f}" height="48" rx="24" fill="{oklch(0.96, 0.03, 260)}" stroke="{oklch(0.90, 0.05, 260)}"/>')
    card.append(kicker_path)

    title_lines = wrapped(title, 68, W - 2 * MARGIN, tracking=-0.02)
    title_y = 294
    for index, line in enumerate(title_lines):
        card.append(draw(SANS, line, 68, MARGIN, title_y + index * 74, INK, -0.02, 0.023)[0])

    subtitle_y = title_y + len(title_lines) * 74 + 22
    for index, line in enumerate(wrapped(subtitle, 26, W - 2 * MARGIN, 2)):
        card.append(draw(SANS, line, 26, MARGIN, subtitle_y + index * 36, MUTED)[0])

    card.append(draw(MONO5, route, 18, MARGIN, 570, BLUE)[0])
    card.append(f'<rect x="0" y="{H - 16}" width="{W}" height="16" fill="{BLUE}"/>')
    card_svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(card)}</svg>'
    output = os.path.join(ROOT, "public", filename)
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as handle:
        handle.write(card_svg)
        source = handle.name
    try:
        subprocess.run(
            ["node", "-e", f"require('sharp')({source!r},{{density:144}}).resize({W},{H}).png({{compressionLevel:9}}).toFile({output!r})"],
            cwd=ROOT,
            check=True,
        )
    finally:
        os.unlink(source)
    print(output)


def render_article_card(filename, eyebrow, headline, arms, route):
    """The benchmark article's own card.

    The catalog template (render_blue_card) would work here and would say
    nothing: this piece is about three stacks that diverged in size and each
    hid a different defect, so the card shows the measured divergence -- one
    tile per container -- and names what each arm was concealing. Tiles are
    green because all three Package Skills are green; red is reserved for the
    defect, so both colours carry meaning rather than decoration.
    """
    card = [f'<rect width="{W}" height="{H}" fill="{BG}"/>']

    card.append(f'<clipPath id="amark"><rect x="{MARGIN}" y="56" width="{MARK}" height="{MARK}" rx="{MARK * 0.2}"/></clipPath>')
    card.append('<g clip-path="url(#amark)">')
    card.append(f'<rect x="{MARGIN}" y="56" width="{MARK}" height="{MARK}" fill="{GREEN}"/>')
    card.append(f'<rect x="{MARGIN}" y="56" width="{MARK / 3:.3f}" height="{MARK}" fill="{RED}"/>')
    card.append(f'<rect x="{MARGIN + 2 * MARK / 3:.3f}" y="56" width="{MARK / 3:.3f}" height="{MARK}" fill="{BLUE}"/>')
    card.append('</g>')
    card.append(draw(SANS, "Colors", 34, MARGIN + MARK + 18, 98, INK, -0.01, 0.022)[0])

    card.append(draw(MONO6, eyebrow.upper(), 17, MARGIN, 160, MUTED, 0.10)[0])

    for index, line in enumerate(headline):
        card.append(draw(SANS, line, 58, MARGIN, 236 + index * 66, INK, -0.02, 0.023)[0])

    # One tile per container. Ten tiles is not a decorative choice: it is what
    # the PostHog arm actually needed against Umami's three.
    TILE, GAP, ROW = 20, 7, 56
    name_x = MARGIN
    tile_x = MARGIN + max(text(MONO6, n, 22)[1] for n, _, _ in arms) + 28
    widest = max(count for _, count, _ in arms)
    note_x = tile_x + widest * (TILE + GAP) + 24
    top = 392

    for index, (name, count, defect) in enumerate(arms):
        y = top + index * ROW
        card.append(draw(MONO6, name, 22, name_x, y + TILE - 4, INK)[0])
        for tile in range(count):
            x = tile_x + tile * (TILE + GAP)
            card.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{TILE}" height="{TILE}" rx="4" fill="{GREEN}"/>')
        card.append(draw(MONO5, defect, 18, note_x, y + TILE - 4, RED)[0])

    card.append(draw(MONO5, route, 18, MARGIN, 580, MUTED)[0])
    card.append(f'<rect x="0" y="{H - 14}" width="{W}" height="14" fill="{GREEN}"/>')

    card_svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(card)}</svg>'
    output = os.path.join(ROOT, "public", filename)
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as handle:
        handle.write(card_svg)
        source = handle.name
    try:
        subprocess.run(
            ["node", "-e", f"require('sharp')({source!r},{{density:144}}).resize({W},{H}).png({{compressionLevel:9}}).toFile({output!r})"],
            cwd=ROOT,
            check=True,
        )
    finally:
        os.unlink(source)
    print(output)


def render_post_card(filename, eyebrow, headline, subtitle, route):
    """A card for articles whose subject has no figure of its own.

    Two articles were unfurling an in-article diagram at 1376x768 while the
    page declared the standard 1200x630, so scrapers cropped them. These are
    generated at the real size instead.
    """
    card = [f'<rect width="{W}" height="{H}" fill="{BG}"/>']

    card.append(f'<clipPath id="pmark"><rect x="{MARGIN}" y="56" width="{MARK}" height="{MARK}" rx="{MARK * 0.2}"/></clipPath>')
    card.append('<g clip-path="url(#pmark)">')
    card.append(f'<rect x="{MARGIN}" y="56" width="{MARK}" height="{MARK}" fill="{GREEN}"/>')
    card.append(f'<rect x="{MARGIN}" y="56" width="{MARK / 3:.3f}" height="{MARK}" fill="{RED}"/>')
    card.append(f'<rect x="{MARGIN + 2 * MARK / 3:.3f}" y="56" width="{MARK / 3:.3f}" height="{MARK}" fill="{BLUE}"/>')
    card.append('</g>')
    card.append(draw(SANS, "Colors", 34, MARGIN + MARK + 18, 98, INK, -0.01, 0.022)[0])

    card.append(draw(MONO6, eyebrow.upper(), 17, MARGIN, 162, MUTED, 0.10)[0])

    lines = wrapped(headline, 58, W - 2 * MARGIN, 3, tracking=-0.02)
    for index, line in enumerate(lines):
        card.append(draw(SANS, line, 58, MARGIN, 244 + index * 66, INK, -0.02, 0.023)[0])

    sub_y = 244 + len(lines) * 66 + 30
    for index, line in enumerate(wrapped(subtitle, 25, W - 2 * MARGIN, 2)):
        card.append(draw(SANS, line, 25, MARGIN, sub_y + index * 34, MUTED)[0])

    card.append(draw(MONO5, route, 18, MARGIN, 580, MUTED)[0])
    card.append(f'<rect x="0" y="{H - 14}" width="{W}" height="14" fill="{GREEN}"/>')

    card_svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(card)}</svg>'
    output = os.path.join(ROOT, "public", filename)
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as handle:
        handle.write(card_svg)
        source = handle.name
    try:
        subprocess.run(
            ["node", "-e", f"require('sharp')({source!r},{{density:144}}).resize({W},{H}).png({{compressionLevel:9}}).toFile({output!r})"],
            cwd=ROOT,
            check=True,
        )
    finally:
        os.unlink(source)
    print(output)


def recipes():
    parsed = []
    for path in sorted(glob.glob(os.path.join(ROOT, "recipes", "*.yml"))):
        raw = open(path, encoding="utf-8").read()
        type_match = re.search(r"^type:\s*(\S+)\s*$", raw, re.M)
        recipe_type = type_match.group(1) if type_match else "package"
        product = re.search(r"^name:\s*(.+)$", raw, re.M).group(1).strip()
        repository = re.search(r"^repository:\s*(.+)$", raw, re.M).group(1).strip()
        summary = re.search(r"^summary:\s*(.+)$", raw, re.M).group(1).strip()
        entries = []
        if recipe_type == "package":
            for match in re.finditer(r"^\s+- name:\s*(\S+)\s*$.*?^\s+runtime:\s*(red|green|blue)\s*$", raw, re.M | re.S):
                entries.append((match.group(1), match.group(2)))
        else:
            for match in re.finditer(r"^\s+- name:\s*(\S+)\s*$", raw, re.M):
                entries.append((match.group(1), None))
        parsed.append((recipe_type, product, repository, summary, entries))
    return parsed


catalog_recipes = recipes()
package_recipes = [recipe for recipe in catalog_recipes if recipe[0] == "package"]
all_skills = sum(len(recipe[4]) for recipe in package_recipes)
context_skill_count = sum(len(recipe[4]) for recipe in catalog_recipes if recipe[0] == "context")
# og-context-skills-v3.png is a supplied dark promotional card, cropped
# centrally from 2752x1536 to 1200x630 and re-encoded to strip an inverted gAMA
# chunk, not generated here — the fifth exception to "og-*.png are generated".
# It replaced v2, the article's own infographic letterboxed on the artwork's
# rgb(209,210,213) border; the generated v1 text card never shipped.

# og-neon-self-hosting-v2.png is the article's supplied infographic fitted
# without cropping onto the standard 1200x630 white social-card canvas. The
# original 2752x1536 artwork remains the in-article figure under public/images/.
# (The generated v1 text card never shipped; the suffix follows the rule.)

render_post_card(
    "og-gemini-3-7-flash-benchmark-v1.png",
    "Benchmark · Gemini 3.7 Flash",
    "Three-node PostgreSQL and MySQL HA clusters, built from scratch",
    "An empirical creation-effort benchmark: provisioning, failover and continuous backups to Cloudflare R2.",
    "/blog/gemini-3-7-flash-benchmark",
)

render_post_card(
    "og-agentic-devops-compounding-advantage-v1.png",
    "Architecture",
    "Agentic DevOps has a compounding advantage",
    "Every verified Package Skill becomes an executable corpus that shrinks the work the next deployment needs.",
    "/blog/agentic-devops-compounding-advantage",
)

render_post_card(
    "og-single-host-data-warehouse-v1.png",
    "Architecture · Single host",
    "You probably don't need the modern data stack",
    "dlt, dbt, ClickHouse, PocketBase and systemd on one $40 VM replace a four-figure SaaS bundle.",
    "/blog/single-host-data-warehouse",
)

# og-agentic-once-deterministic-forever-v2.png is a hand-supplied infographic,
# not generated here — the one exception to "og-*.png are generated". Replacing
# it means bumping the version suffix, same as generated cards.

# og-automq-acceptance-gates-v2.png is the article's supplied infographic fitted
# without cropping onto the standard 1200x630 canvas, not generated here. It
# pads with the artwork's own near-black background (22, 24, 27) rather than the
# white the other supplied cards use: this artwork is dark, so white bars would
# read as a rendering fault rather than as canvas. The original 2752x1536
# artwork remains the in-article figure under public/images/. The generated v1
# text card it replaced is retired.

render_post_card(
    "og-remote-clipboard-for-agents-v1.png",
    "Architecture · Remote development",
    "Let your remote coding agent see your clipboard",
    "pngpaste, socat, launchd and one ssh -R forward hand a Mac clipboard to an agent on the server as a Unix socket.",
    "/blog/remote-clipboard-for-agents",
)

# og-park-the-stochasticity-v2.png is the article's own infographic letterboxed
# to 1200x630, not generated here — the second exception to "og-*.png are
# generated", alongside the card above. The generated v1 text card it replaced
# never shipped. Replacing it means bumping the version suffix, same as a
# generated card.

# og-agentic-devops-manifesto-v2.png is the article's own infographic
# letterboxed to 1200x630 on #f8f8f8, not generated here — the third exception
# to "og-*.png are generated". Unlike the two above, the generated v1 text card
# it replaced did ship, so the version suffix is doing real cache-busting work
# rather than following the rule pre-emptively.

# og-how-a-package-skill-gets-made-v2.png is the article's own infographic
# letterboxed to 1200x630 on #f0f2f5, not generated here — the fourth exception
# to "og-*.png are generated". The generated v1 text card it replaced never
# shipped; the version suffix follows the rule pre-emptively.

render_post_card(
    "og-posthog-skill-benchmark-v1.png",
    "Benchmark · 2 agents · PostHog",
    "Both agents reported success. Only one checked.",
    "A curated skill cut agent effort by 77%. The baseline never proved its deployment could store an event.",
    "/blog/posthog-skill-benchmark",
)

# The benchmark article. Counts and defects are the audited findings, not
# illustration: 3/6/10 containers, and the defect each arm's own gates missed.
render_article_card(
    "og-analytics-benchmark-v1.png",
    "Benchmark · 3 agents · 3 analytics stacks",
    ["All three passed their own gates.", "All three were hiding a defect."],
    [
        ("umami", 3, "default admin credentials live"),
        ("rybbit", 6, "backups had never once succeeded"),
        ("posthog", 10, "zero migrations, HTTP 502"),
    ],
    "/blog/self-hosted-analytics-benchmark",
)

catalog_card_text = f"{len(package_recipes)} curated sources and {all_skills} Package Skills for production infrastructure."
if context_skill_count:
    catalog_card_text = (
        f"{len(package_recipes)} curated sources, {all_skills} Package Skills, and "
        f"{context_skill_count} Context Skill{'s' if context_skill_count != 1 else ''} for production infrastructure."
    )
# v2 on 2026-08-27: the heading changed from "Package Skills Catalog" when
# Context Skills joined the catalog — new artwork means a new filename.
render_blue_card("og-catalog-blue-v2.png", "Catalog", "Skills Catalog", catalog_card_text, "/skills")
render_blue_card("og-featured-blue-v1.png", "Featured", "Featured Package Skills", "Production examples of deterministic, agent-operated infrastructure built with Colors.", "/featured")

# One source card per repository, not per recipe: Context Skills share
# getcolors/skills, and /{owner}/{repository} exists once.
owners = {}
repository_recipes = {}
for recipe_type, product, repository, summary, entries in catalog_recipes:
    owner, repo = repository.split("/", 1)
    owners.setdefault(owner, [set(), 0])
    owners[owner][0].add(repository)
    if recipe_type == "package":
        owners[owner][1] += len(entries)
    repository_recipes.setdefault(repository, []).append((recipe_type, product, summary))
    for skill_name, runtime in entries:
        skill_label = f"Package Skill - {runtime}" if runtime else "Context Skill"
        render_blue_card(f"og-skill-{slug(owner)}-{slug(repo)}-{slug(skill_name)}-blue-v1.png", skill_label, skill_name, summary, f"/{owner}/{repo}/{skill_name}")
# A repository with several recipes gets a card named after the repository,
# since no single recipe's name describes the page.
for repository, recipe_group in repository_recipes.items():
    owner, repo = repository.split("/", 1)
    if len(recipe_group) == 1:
        recipe_type, product, summary = recipe_group[0]
        source_label = "Package Skill source" if recipe_type == "package" else "Context Skill source"
        render_blue_card(f"og-source-{slug(owner)}-{slug(repo)}-blue-v1.png", source_label, product, summary, f"/{owner}/{repo}")
    else:
        kinds = {recipe_type for recipe_type, _, _ in recipe_group}
        source_label = "Context Skill source" if kinds == {"context"} else "Skill source"
        group_summary = (
            f"{len(recipe_group)} curated Context Skills distilled from verified builds."
            if kinds == {"context"}
            else f"{len(recipe_group)} curated skills."
        )
        render_blue_card(f"og-source-{slug(owner)}-{slug(repo)}-blue-v1.png", source_label, repository, group_summary, f"/{owner}/{repo}")
for owner, (repositories, skill_count) in owners.items():
    render_blue_card(f"og-owner-{slug(owner)}-blue-v1.png", "Package Skill owner", owner, f"{len(repositories)} curated sources and {skill_count} Package Skills.", f"/{owner}")

for w in dict.fromkeys(_warnings):
    print("warning:", w, file=sys.stderr)
print(OUT)
