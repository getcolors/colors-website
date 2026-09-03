// Markdown for Agents. Caddy rewrites `/` to `/index.md` when the request
// carries `Accept: text/markdown` — see the @markdown handle in Caddyfile.prod.
// Browsers send Accept: text/html and keep getting index.astro.
//
// The copy is NOT duplicated here. Both this route and index.astro render
// src/data/landing.ts, so a wording change lands in both by construction.
// They used to be two hand-maintained copies and drifted twice: b761193 put
// the real colors.yml in the hero and left this file describing a schema the
// product does not accept, and the same class of miss shipped a stale org name
// on the og:image.
//
// The prose in landing.ts is authored in markdown, so this file interpolates
// it verbatim; index.astro is the one that has to convert.

import type { APIContext } from "astro";
import {
  colorsYml,
  createContextSkill,
  createContextSkillCmd,
  createPackageSkill,
  createPackageSkillCmd,
  difference,
  footer,
  hero,
  installCmd,
  libraries,
  meta,
  realExample,
  shapes,
  skillMatrix,
  submitContextSkill,
  submitContextSkillCmd,
  submitPackageSkill,
  submitPackageSkillCmd,
  topology,
  trust,
  workflow,
} from "~/data/landing";

const fence = (lang: string, body: string) => `\`\`\`${lang}\n${body}\n\`\`\``;

/** Hard-wrap prose at 78 columns, indenting continuation lines. Markdown does
 *  not care, but the twin is read as a raw file often enough to be worth
 *  keeping tidy — the hand-written version it replaced wrapped the same way.
 *  Never applied to fences or tables, where a line break would change meaning. */
const wrap = (text: string, indent = "", width = 78) => {
  const lines: string[] = [];
  let line = "";
  // A token is a run of non-space characters, except that a `code span` counts
  // as one character class of its own so an inner space cannot become a line
  // break. CommonMark would still read `create --dry-run` correctly split
  // across lines, but the raw file is meant to be legible too.
  for (const word of text.match(/(?:`[^`]*`|\S)+/g) ?? []) {
    const prefix = lines.length ? indent : "";
    if (line && `${prefix}${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.map((l, i) => (i ? indent + l : l)).join("\n");
};

const quote = (text: string) =>
  wrap(text, "", 76)
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");

export async function GET({ site }: APIContext) {
  // No fallback literal — see the comment in sitemap.xml.ts.
  if (!site) throw new Error("`site` is unset in astro.config.mjs");
  const canonical = new URL("/", site).toString();

  const body = `# ${meta.title}

${quote(meta.description)}

Canonical HTML: ${canonical}

## Install

${wrap(hero.installNote)}

${fence("sh", installCmd)}

${wrap("A Package Skill is configured with a `colors.yml` — this is an excerpt of the real one behind a six-machine Langfuse deployment:")}

${fence("yaml", colorsYml)}

## ${realExample.heading}

${wrap(realExample.lede)}

${realExample.results.map((result) => `- ${result}`).join("\n")}

${wrap(realExample.note)}

${wrap(`**${topology.caption}** — four firewall groups, six machines, one VPC:`)}

${topology.groups.map((g) => wrap(`- **${g.name}** (${g.plan}): ${g.machines.join("; ")}`, "  ")).join("\n")}

${topology.edges.map((e) => wrap(`- ${e}`, "  ")).join("\n")}

Documentation: https://getcolors.github.io/langfuse/
Repository: https://github.com/getcolors/langfuse

## ${shapes.heading}

${wrap(shapes.lede)}

${shapes.items.map((item) => wrap(`- **${item.name}** — ${item.meta}. ${item.body} ${canonical.replace(/\/$/, "")}${item.href}`, "  ")).join("\n")}

## ${workflow.heading}

${wrap(workflow.lede)}

${workflow.steps.map((step, i) => wrap(`${i + 1}. **${step.title} — \`${step.command}\`.** ${step.body}`, "   ")).join("\n")}

## ${difference.heading}

${wrap(difference.lede)}

${difference.cards.map((c) => wrap(`- **${c.label} — ${c.title}.** ${c.body}`, "  ")).join("\n")}

## ${trust.heading}

${trust.cards.map((c) => wrap(`- **${c.title}.** ${c.body}`, "  ")).join("\n")}

## ${libraries.heading}

${wrap(libraries.lede)}

| Library | Runtime | Documentation | Repository |
|---|---|---|---|
${libraries.items.map((l) => `| ${l.name} | ${l.stack} | ${l.docsUrl} | ${l.repoUrl} |`).join("\n")}

## ${skillMatrix.heading}

${wrap(skillMatrix.lede)}

| | ${skillMatrix.columns.join(" | ")} |
|---|---|---|
${skillMatrix.rows.map((r) => `| **${r.verb}** | ${r.cells.map((c) => `**${c.title}** — ${c.body}`).join(" | ")} |`).join("\n")}

## ${createPackageSkill.heading}

${wrap(createPackageSkill.lede)}

${wrap(createPackageSkill.useNote)}

${fence("sh", createPackageSkillCmd)}

Documentation: ${createPackageSkill.docsUrl}
Repository: ${createPackageSkill.repoUrl}

${createPackageSkill.phases.map((phase, i) => wrap(`${i + 1}. **${phase.title}.** ${phase.body}`, "   ")).join("\n")}

## ${submitPackageSkill.heading}

${wrap(submitPackageSkill.lede)}

${wrap(submitPackageSkill.useNote)}

${fence("sh", submitPackageSkillCmd)}

Documentation: ${submitPackageSkill.docsUrl}
Repository: ${submitPackageSkill.repoUrl}

${submitPackageSkill.phases.map((phase, i) => wrap(`${i + 1}. **${phase.title}.** ${phase.body}`, "   ")).join("\n")}

## ${createContextSkill.heading}

${wrap(createContextSkill.lede)}

${wrap(createContextSkill.useNote)}

${fence("sh", createContextSkillCmd)}

Documentation: ${createContextSkill.docsUrl}
Repository: ${createContextSkill.repoUrl}

${createContextSkill.phases.map((phase, i) => wrap(`${i + 1}. **${phase.title}.** ${phase.body}`, "   ")).join("\n")}

## ${submitContextSkill.heading}

${wrap(submitContextSkill.lede)}

${wrap(submitContextSkill.useNote)}

${fence("sh", submitContextSkillCmd)}

Documentation: ${submitContextSkill.docsUrl}
Repository: ${submitContextSkill.repoUrl}

${submitContextSkill.phases.map((phase, i) => wrap(`${i + 1}. **${phase.title}.** ${phase.body}`, "   ")).join("\n")}

## Find infrastructure your agent can operate

Browse the PR-curated Skills Catalog by platform, provider, or runtime:
${new URL("/skills", site).toString()}

---

${footer.name} — ${footer.links.map((link) => `${link.label}: ${link.href}`).join(" · ")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
