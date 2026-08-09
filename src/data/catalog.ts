import { Marked } from "marked";
import { parse as parseYaml } from "yaml";
import { packageSkillDefinition } from "~/data/landing";

export { packageSkillDefinition };

export type Runtime = "red" | "green" | "blue";

type RecipePackageSkill = {
  name: string;
  path: string;
  runtime: Runtime;
};

export type Recipe = {
  name: string;
  repository: string;
  summary: string;
  keywords: string[];
  featured?: string;
  branch: string;
  packageSkills: RecipePackageSkill[];
};

export type PackageSkill = RecipePackageSkill & {
  owner: string;
  repository: string;
  repositoryName: string;
  productName: string;
  productSummary: string;
  keywords: string[];
  featured?: string;
  description: string;
  license?: string;
  markdown: string;
  html: string;
  installs: number;
  url: string;
  sourceUrl: string;
  skillsShUrl: string;
  installCommand: string;
  prompt: string;
};

export type CatalogSource = Recipe & {
  owner: string;
  repositoryName: string;
  url: string;
  githubUrl: string;
  installs: number;
  packageSkills: PackageSkill[];
};

export type CatalogOwner = {
  name: string;
  url: string;
  githubUrl: string;
  installs: number;
  sources: CatalogSource[];
  packageSkills: PackageSkill[];
};

export type Catalog = {
  sources: CatalogSource[];
  packageSkills: PackageSkill[];
  owners: CatalogOwner[];
};

export const catalogOgImage = (kind: "owner" | "source" | "skill", ...parts: string[]) =>
  `/og-${kind}-${parts.map((part) => part.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).join("-")}-blue-v1.png`;

export const runtimeLabels: Record<Runtime, string> = {
  red: "TypeScript / Bun",
  green: "Clojure / Babashka",
  blue: "Python / uv",
};

const recipeModules = import.meta.glob("../../recipes/*.yml", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const fail = (source: string, message: string): never => {
  throw new Error(`${source}: ${message}`);
};

const readRecipes = (): Recipe[] => {
  const names = new Set<string>();
  const identities = new Set<string>();
  return Object.entries(recipeModules)
    .map(([source, raw]) => {
      const value = parseYaml(raw) as Record<string, unknown>;
      const name = value.name;
      const repository = value.repository;
      const summary = value.summary;
      const keywords = value.keywords;
      const featured = value.featured;
      const branch = value.branch ?? "main";
      const entries = value["package-skills"];

      if (typeof name !== "string" || !name.trim()) fail(source, "name is required");
      if (typeof repository !== "string" || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
        fail(source, "repository must be owner/name");
      }
      if (typeof summary !== "string" || !summary.trim()) fail(source, "summary is required");
      if (!Array.isArray(keywords) || !keywords.every((item) => typeof item === "string")) {
        fail(source, "keywords must be a list of strings");
      }
      if (featured !== undefined && (typeof featured !== "string" || !featured.startsWith("/"))) {
        fail(source, "featured must be a site-relative URL");
      }
      if (typeof branch !== "string" || !branch) fail(source, "branch must be a string");
      if (!Array.isArray(entries) || entries.length === 0) {
        fail(source, "package-skills must contain at least one entry");
      }
      const recipeName = name as string;
      const recipeRepository = repository as string;
      const recipeSummary = summary as string;
      const recipeKeywords = keywords as string[];
      const recipeBranch = branch as string;
      const recipeEntries = entries as unknown[];

      if (names.has(recipeName.toLowerCase())) fail(source, `duplicate name ${recipeName}`);
      names.add(recipeName.toLowerCase());

      const packageSkills = recipeEntries.map((entry, index) => {
        if (!entry || typeof entry !== "object") fail(source, `package-skills[${index}] is invalid`);
        const item = entry as Record<string, unknown>;
        if (typeof item.name !== "string" || !/^package-[a-z0-9-]+$/.test(item.name)) {
          fail(source, `package-skills[${index}].name must start with package-`);
        }
        if (typeof item.path !== "string" || !item.path.endsWith("/SKILL.md")) {
          fail(source, `package-skills[${index}].path must end in /SKILL.md`);
        }
        if (item.runtime !== "red" && item.runtime !== "green" && item.runtime !== "blue") {
          fail(source, `package-skills[${index}].runtime is invalid`);
        }
        const packageSkill = {
          name: item.name as string,
          path: item.path as string,
          runtime: item.runtime as Runtime,
        };
        const identity = `${recipeRepository}/${packageSkill.name}`;
        if (identities.has(identity)) fail(source, `duplicate Package Skill ${identity}`);
        identities.add(identity);
        return packageSkill;
      });

      return {
        name: recipeName,
        repository: recipeRepository,
        summary: recipeSummary,
        keywords: recipeKeywords,
        featured: featured as string | undefined,
        branch: recipeBranch,
        packageSkills,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

const fetchText = async (url: string, required: boolean) => {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "getcolors-package-skills-catalog" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    if (required) throw new Error(`Could not load ${url}: ${error}`);
    console.warn(`Could not load optional catalog data from ${url}: ${error}`);
    return "";
  }
};

const parseFrontmatter = (source: string, url: string) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${url} has no YAML frontmatter`);
  const data = parseYaml(match[1]) as Record<string, unknown>;
  if (typeof data.name !== "string" || typeof data.description !== "string") {
    throw new Error(`${url} needs string name and description frontmatter`);
  }
  return {
    name: data.name,
    description: data.description,
    license: typeof data.license === "string" ? data.license : undefined,
    body: source.slice(match[0].length),
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderMarkdown = (markdown: string, sourceDirectory: string) => {
  const absolute = (href: string, raw = false) => {
    if (/^(?:https?:|mailto:|#)/i.test(href)) return href;
    const clean = href.replace(/^\.\//, "");
    return raw
      ? `https://raw.githubusercontent.com/${sourceDirectory.replace("/blob/", "/")}/${clean}`
      : `https://github.com/${sourceDirectory}/${clean}`;
  };
  const marked = new Marked({
    gfm: true,
    renderer: {
      html({ text }) {
        return escapeHtml(text);
      },
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens);
        const safeHref = absolute(href);
        const safeTitle = title ? ` title="${escapeHtml(title)}"` : "";
        return `<a href="${escapeHtml(safeHref)}"${safeTitle}>${label}</a>`;
      },
      image({ href, title, text }) {
        const safeTitle = title ? ` title="${escapeHtml(title)}"` : "";
        return `<img src="${escapeHtml(absolute(href, true))}" alt="${escapeHtml(text)}"${safeTitle} loading="lazy">`;
      },
    },
  });
  return marked.parse(markdown) as string;
};

const loadInstalls = async (owner: string, repository: string, name: string) => {
  const url = `https://www.skills.sh/${owner}/${repository}/${name}`;
  const html = await fetchText(url, false);
  const match = html.match(/"userInteractionCount"\s*:\s*(\d+)/);
  return { installs: match ? Number(match[1]) : 0, url };
};

let catalogPromise: Promise<Catalog> | undefined;

export const loadCatalog = () => {
  catalogPromise ??= (async () => {
    const recipes = readRecipes();
    const sources = await Promise.all(
      recipes.map(async (recipe): Promise<CatalogSource> => {
        const [owner, repositoryName] = recipe.repository.split("/");
        const packageSkills = await Promise.all(
          recipe.packageSkills.map(async (entry): Promise<PackageSkill> => {
            const rawUrl = `https://raw.githubusercontent.com/${recipe.repository}/${recipe.branch}/${entry.path}`;
            const source = await fetchText(rawUrl, true);
            const metadata = parseFrontmatter(source, rawUrl);
            if (metadata.name !== entry.name) {
              throw new Error(`${rawUrl} declares ${metadata.name}, recipe expects ${entry.name}`);
            }
            const stats = await loadInstalls(owner, repositoryName, entry.name);
            const sourceDirectory = `${recipe.repository}/blob/${recipe.branch}/${entry.path.replace(/\/SKILL\.md$/, "")}`;
            return {
              ...entry,
              owner,
              repository: recipe.repository,
              repositoryName,
              productName: recipe.name,
              productSummary: recipe.summary,
              keywords: recipe.keywords,
              featured: recipe.featured,
              description: metadata.description,
              license: metadata.license,
              markdown: metadata.body,
              html: renderMarkdown(metadata.body, sourceDirectory),
              installs: stats.installs,
              url: `/${owner}/${repositoryName}/${entry.name}`,
              sourceUrl: `https://github.com/${recipe.repository}/blob/${recipe.branch}/${entry.path}`,
              skillsShUrl: stats.url,
              installCommand: `npx skills add https://github.com/${recipe.repository} --skill ${entry.name}`,
              prompt: `Run \`npx skills use "https://github.com/${recipe.repository}" --skill "${entry.name}"\` and follow the generated Package Skill instructions now. Read its complete output, redirecting it to a temporary file first if necessary. Resolve relative paths from the supporting-files directory it provides.`,
            };
          }),
        );
        const installs = packageSkills.reduce((total, item) => total + item.installs, 0);
        return {
          ...recipe,
          owner,
          repositoryName,
          url: `/${owner}/${repositoryName}`,
          githubUrl: `https://github.com/${recipe.repository}`,
          installs,
          packageSkills: packageSkills.sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name)),
        };
      }),
    );

    const packageSkills = sources
      .flatMap((source) => source.packageSkills)
      .sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name));
    const ownerNames = [...new Set(sources.map((source) => source.owner))];
    const owners = ownerNames.map((name): CatalogOwner => {
      const ownerSources = sources
        .filter((source) => source.owner === name)
        .sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name));
      const ownerPackageSkills = ownerSources.flatMap((source) => source.packageSkills);
      return {
        name,
        url: `/${name}`,
        githubUrl: `https://github.com/${name}`,
        installs: ownerPackageSkills.reduce((total, item) => total + item.installs, 0),
        sources: ownerSources,
        packageSkills: ownerPackageSkills,
      };
    });
    return { sources, packageSkills, owners };
  })();
  return catalogPromise;
};

export const formatInstalls = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return new Intl.NumberFormat("en-US").format(value);
};
