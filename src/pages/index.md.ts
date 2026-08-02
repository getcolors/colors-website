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
  airflow,
  airflowInstallCmd,
  bundles,
  clickhouse,
  clickhouseInstallCmd,
  colorsYml,
  cta,
  footer,
  hero,
  installCmd,
  k3s,
  k3sInstallCmd,
  libraries,
  meta,
  once,
  primitive,
  walter,
  walterInstallCmd,
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

${wrap("A Package Skill is configured with a `colors.yml` — this is the one that deploys this site:")}

${fence("yaml", colorsYml)}

## ${primitive.heading}

${wrap(primitive.lede)}

${primitive.cards.map((c) => wrap(`- **${c.label} — ${c.title}.** ${c.body}`, "  ")).join("\n")}

## ${bundles.heading}

${bundles.cards.map((c) => wrap(`- **${c.title}.** ${c.body}`, "  ")).join("\n")}

## ${libraries.heading}

${wrap(libraries.lede)}

| Library | Runtime | Repository |
|---|---|---|
${libraries.items.map((l) => `| ${l.name} | ${l.stack} | ${l.url} |`).join("\n")}

## ${k3s.heading}

${wrap(k3s.lede)}

${wrap(k3s.runtimeNote)}

${fence("sh", k3sInstallCmd)}

${k3s.steps.map((s, i) => wrap(`${i + 1}. **${s.title}.** ${s.body}`, "   ")).join("\n")}

${wrap(`${k3s.dagSummary} ${k3s.dagNote}`)}

## ${clickhouse.heading}

${wrap(clickhouse.lede)}

${wrap(clickhouse.runtimeNote)}

${fence("sh", clickhouseInstallCmd)}

${clickhouse.steps.map((s, i) => wrap(`${i + 1}. **${s.title}.** ${s.body}`, "   ")).join("\n")}

${wrap(`${clickhouse.dagSummary} ${clickhouse.dagNote}`)}

## ${airflow.heading}

${wrap(airflow.lede)}

${wrap(airflow.runtimeNote)}

${fence("sh", airflowInstallCmd)}

${airflow.steps.map((s, i) => wrap(`${i + 1}. **${s.title}.** ${s.body}`, "   ")).join("\n")}

${wrap(`${airflow.dagSummary} ${airflow.dagNote}`)}

## ${once.heading}

${wrap(once.lede)}

${wrap(once.runtimeNote)}

${fence("sh", installCmd)}

${once.steps.map((s, i) => wrap(`${i + 1}. **${s.title}.** ${s.body}`, "   ")).join("\n")}

${wrap(`${once.dagSummary} ${once.dagNote}`)}

## ${walter.heading}

${wrap(walter.lede)}

${wrap(walter.runtimeNote)}

${fence("sh", walterInstallCmd)}

${walter.steps.map((s, i) => wrap(`${i + 1}. **${s.title}.** ${s.body}`, "   ")).join("\n")}

${wrap(`${walter.dagSummary} ${walter.dagNote}`)}

## ${cta.heading.replace(/\.$/, "")}

${wrap(cta.lede)}

${fence("sh", installCmd)}

---

${footer.name} — ${footer.href}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
