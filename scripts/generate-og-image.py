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
        product = re.search(r"^name:\s*(.+)$", raw, re.M).group(1).strip()
        repository = re.search(r"^repository:\s*(.+)$", raw, re.M).group(1).strip()
        summary = re.search(r"^summary:\s*(.+)$", raw, re.M).group(1).strip()
        entries = []
        for match in re.finditer(r"^\s+- name:\s*(\S+)\s*$.*?^\s+runtime:\s*(red|green|blue)\s*$", raw, re.M | re.S):
            entries.append((match.group(1), match.group(2)))
        parsed.append((product, repository, summary, entries))
    return parsed


catalog_recipes = recipes()
all_skills = sum(len(recipe[3]) for recipe in catalog_recipes)
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

render_post_card(
    "og-remote-clipboard-for-agents-v1.png",
    "Architecture · Remote development",
    "Let your remote coding agent see your clipboard",
    "pngpaste, socat, launchd and one ssh -R forward hand a Mac clipboard to an agent on the server as a Unix socket.",
    "/blog/remote-clipboard-for-agents",
)

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

render_blue_card("og-catalog-blue-v1.png", "Catalog", "Package Skills Catalog", f"{len(catalog_recipes)} curated sources and {all_skills} Package Skills for production infrastructure.", "/skills")
render_blue_card("og-featured-blue-v1.png", "Featured", "Featured Package Skills", "Production examples of deterministic, agent-operated infrastructure built with Colors.", "/featured")

owners = {}
for product, repository, summary, entries in catalog_recipes:
    owner, repo = repository.split("/", 1)
    owners.setdefault(owner, [0, 0])
    owners[owner][0] += 1
    owners[owner][1] += len(entries)
    render_blue_card(f"og-source-{slug(owner)}-{slug(repo)}-blue-v1.png", "Package Skill source", product, summary, f"/{owner}/{repo}")
    for skill_name, runtime in entries:
        render_blue_card(f"og-skill-{slug(owner)}-{slug(repo)}-{slug(skill_name)}-blue-v1.png", f"Package Skill - {runtime}", skill_name, summary, f"/{owner}/{repo}/{skill_name}")
for owner, (source_count, skill_count) in owners.items():
    render_blue_card(f"og-owner-{slug(owner)}-blue-v1.png", "Package Skill owner", owner, f"{source_count} curated sources and {skill_count} Package Skills.", f"/{owner}")

for w in dict.fromkeys(_warnings):
    print("warning:", w, file=sys.stderr)
print(OUT)
