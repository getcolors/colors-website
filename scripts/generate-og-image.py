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
import math
import os
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

for w in dict.fromkeys(_warnings):
    print("warning:", w, file=sys.stderr)
print(OUT)
