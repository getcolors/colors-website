// The hand-written Shiki theme for every colors.yml block on the site: keys
// blue, values green, literals red — the three library accents, darkened for
// contrast at 13px. Bundled themes were rejected because each imports a
// palette that fights the page. Shiki emits `name` as a class on the <pre>,
// hence "colors-yaml" rather than "colors". It accepts oklch() as-is.
//
// Literal oklch() rather than the var(--red|green|blue) the stylesheet uses:
// Shiki resolves these at build time into inline style attributes on the
// spans, with no stylesheet in scope to resolve a custom property against.
//
// Lived inline in index.astro until 2026-09-02; extracted so the town hall
// page could render its desired-state block with the same colours.
export const yamlTheme = {
  name: "colors-yaml",
  type: "light" as const,
  settings: [
    { settings: { foreground: "oklch(35% 0.01 260)" } },
    {
      scope: ["entity.name.tag", "support.type.property-name"],
      settings: { foreground: "oklch(48% 0.16 260)" },
    },
    { scope: ["string"], settings: { foreground: "oklch(45% 0.13 145)" } },
    { scope: ["constant", "keyword"], settings: { foreground: "oklch(50% 0.19 25)" } },
    { scope: ["punctuation"], settings: { foreground: "oklch(65% 0.01 260)" } },
    { scope: ["comment"], settings: { foreground: "oklch(60% 0.01 260)" } },
  ],
};
