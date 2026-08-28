import { Marked } from "marked";
import { parse as parseYaml } from "yaml";
import { packageSkillDefinition } from "~/data/landing";

export { packageSkillDefinition };

export type Runtime = "red" | "green" | "blue";
export type RecipeType = "package" | "context";

type RecipePackageSkill = {
  name: string;
  path: string;
  runtime: Runtime;
};

type RecipeContextSkill = {
  name: string;
  path: string;
};

export type Recipe = {
  type: RecipeType;
  name: string;
  repository: string;
  summary: string;
  keywords: string[];
  featured?: string;
  companion?: string;
  branch: string;
  packageSkills: RecipePackageSkill[];
  contextSkills: RecipeContextSkill[];
};

type CatalogSkillShared = {
  name: string;
  path: string;
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

export type PackageSkill = CatalogSkillShared & {
  kind: "package";
  runtime: Runtime;
};

export type ContextSkill = CatalogSkillShared & {
  kind: "context";
  companion?: string;
};

export type CatalogSkill = PackageSkill | ContextSkill;

export type CatalogSource = Recipe & {
  owner: string;
  repositoryName: string;
  url: string;
  githubUrl: string;
  installs: number;
  packageSkills: PackageSkill[];
  contextSkills: ContextSkill[];
};

// Several recipes may share one repository (every context skill lives in
// getcolors/skills), but /{owner}/{repository} exists once. Source and owner
// pages therefore render repositories, not recipes — generating routes from
// sources would emit duplicate paths as soon as a second context skill lands.
export type CatalogRepository = {
  owner: string;
  repository: string;
  repositoryName: string;
  url: string;
  githubUrl: string;
  installs: number;
  recipes: CatalogSource[];
  packageSkills: PackageSkill[];
  contextSkills: ContextSkill[];
};

export type CatalogOwner = {
  name: string;
  url: string;
  githubUrl: string;
  installs: number;
  repositories: CatalogRepository[];
  packageSkills: PackageSkill[];
  contextSkills: ContextSkill[];
};

export type Catalog = {
  sources: CatalogSource[];
  repositories: CatalogRepository[];
  packageSkills: PackageSkill[];
  contextSkills: ContextSkill[];
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
      const type = value.type ?? "package";
      const name = value.name;
      const repository = value.repository;
      const summary = value.summary;
      const keywords = value.keywords;
      const featured = value.featured;
      const companion = value.companion;
      const branch = value.branch ?? "main";
      const packageEntries = value["package-skills"];
      const contextEntries = value["context-skills"];

      if (type !== "package" && type !== "context") fail(source, "type must be package or context");
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
      if (companion !== undefined) {
        if (type !== "context") fail(source, "companion is only valid on type context recipes");
        if (typeof companion !== "string" || !/^[\w.-]+\/[\w.-]+$/.test(companion)) {
          fail(source, "companion must be owner/name");
        }
      }
      if (typeof branch !== "string" || !branch) fail(source, "branch must be a string");
      if (type === "package" && contextEntries !== undefined) {
        fail(source, "context-skills is only valid on type context recipes");
      }
      if (type === "context" && packageEntries !== undefined) {
        fail(source, "package-skills is only valid on type package recipes");
      }
      const entries = type === "package" ? packageEntries : contextEntries;
      if (!Array.isArray(entries) || entries.length === 0) {
        fail(source, `${type === "package" ? "package" : "context"}-skills must contain at least one entry`);
      }
      const recipeType = type as RecipeType;
      const recipeName = name as string;
      const recipeRepository = repository as string;
      const recipeSummary = summary as string;
      const recipeKeywords = keywords as string[];
      const recipeBranch = branch as string;
      const recipeEntries = entries as unknown[];

      if (names.has(recipeName.toLowerCase())) fail(source, `duplicate name ${recipeName}`);
      names.add(recipeName.toLowerCase());

      const validateEntry = (entry: unknown, index: number) => {
        const list = recipeType === "package" ? "package-skills" : "context-skills";
        if (!entry || typeof entry !== "object") fail(source, `${list}[${index}] is invalid`);
        const item = entry as Record<string, unknown>;
        if (recipeType === "package") {
          if (typeof item.name !== "string" || !/^package-[a-z0-9-]+$/.test(item.name)) {
            fail(source, `${list}[${index}].name must start with package-`);
          }
          if (item.runtime !== "red" && item.runtime !== "green" && item.runtime !== "blue") {
            fail(source, `${list}[${index}].runtime is invalid`);
          }
        } else {
          if (
            typeof item.name !== "string" ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name) ||
            item.name.startsWith("package-")
          ) {
            fail(source, `${list}[${index}].name must be a spec-valid skill name without the package- prefix`);
          }
          if (item.runtime !== undefined) fail(source, `${list}[${index}].runtime is only valid on Package Skills`);
        }
        const itemName = item.name as string;
        // The Agent Skills spec requires the skill name to match its directory,
        // so the path's parent directory must be the name.
        if (
          typeof item.path !== "string" ||
          !(item.path === `${itemName}/SKILL.md` || item.path.endsWith(`/${itemName}/SKILL.md`))
        ) {
          fail(source, `${list}[${index}].path must end in ${itemName}/SKILL.md`);
        }
        const identity = `${recipeRepository}/${itemName}`;
        if (identities.has(identity)) fail(source, `duplicate skill ${identity}`);
        identities.add(identity);
        return item;
      };

      const packageSkills =
        recipeType === "package"
          ? recipeEntries.map((entry, index) => {
              const item = validateEntry(entry, index);
              return { name: item.name as string, path: item.path as string, runtime: item.runtime as Runtime };
            })
          : [];
      const contextSkills =
        recipeType === "context"
          ? recipeEntries.map((entry, index) => {
              const item = validateEntry(entry, index);
              return { name: item.name as string, path: item.path as string };
            })
          : [];

      return {
        type: recipeType,
        name: recipeName,
        repository: recipeRepository,
        summary: recipeSummary,
        keywords: recipeKeywords,
        featured: featured as string | undefined,
        companion: companion as string | undefined,
        branch: recipeBranch,
        packageSkills,
        contextSkills,
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
  const headingIds = new Map<string, number>();
  const headingId = (text: string) => {
    const base = text
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-") || "section";
    const seen = headingIds.get(base) ?? 0;
    headingIds.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen}`;
  };
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
      heading({ tokens, depth }) {
        const label = this.parser.parseInline(tokens);
        const text = tokens.map((token) => "text" in token ? String(token.text) : token.raw).join("");
        const id = headingId(text);
        const level = Math.min(depth + 1, 6);
        return `<h${level} id="${escapeHtml(id)}">${label}</h${level}>`;
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
        const loadShared = async (entry: { name: string; path: string }): Promise<CatalogSkillShared> => {
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
            prompt: `Run \`npx skills use "https://github.com/${recipe.repository}" --skill "${entry.name}"\` and follow the generated Package Skill instructions now. Read its complete output, redirecting it to a temporary file first if necessary, and resolve relative paths from the supporting-files directory it names. This skill reconciles real infrastructure to desired state: stay on the safe verbs — \`build\` and \`create --dry-run\` — until the user explicitly authorizes a converge that creates paid resources.`,
          };
        };
        const packageSkills = await Promise.all(
          recipe.packageSkills.map(async (entry): Promise<PackageSkill> => ({
            ...(await loadShared(entry)),
            kind: "package",
            runtime: entry.runtime,
          })),
        );
        const contextSkills = await Promise.all(
          recipe.contextSkills.map(async (entry): Promise<ContextSkill> => {
            const shared = await loadShared(entry);
            return {
              ...shared,
              kind: "context",
              companion: recipe.companion,
              prompt: `Run \`npx skills use "https://github.com/${recipe.repository}" --skill "${entry.name}"\` and read the Context Skill's complete output before continuing, redirecting it to a temporary file first if necessary. It is reference, not a workflow: symptom-indexed traps, contracts, and acceptance doctrine verified against a running deployment. Match your symptoms against its index before debugging from first principles, and hold your build to its acceptance gates instead of assuming success.`,
            };
          }),
        );
        const installs = [...packageSkills, ...contextSkills].reduce((total, item) => total + item.installs, 0);
        return {
          ...recipe,
          owner,
          repositoryName,
          url: `/${owner}/${repositoryName}`,
          githubUrl: `https://github.com/${recipe.repository}`,
          installs,
          packageSkills: packageSkills.sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name)),
          contextSkills: contextSkills.sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name)),
        };
      }),
    );

    const bySkillRank = (a: CatalogSkillShared, b: CatalogSkillShared) =>
      b.installs - a.installs || a.name.localeCompare(b.name);
    const packageSkills = sources.flatMap((source) => source.packageSkills).sort(bySkillRank);
    const contextSkills = sources.flatMap((source) => source.contextSkills).sort(bySkillRank);

    const byRepository = new Map<string, CatalogRepository>();
    for (const source of sources) {
      let repository = byRepository.get(source.repository);
      if (!repository) {
        repository = {
          owner: source.owner,
          repository: source.repository,
          repositoryName: source.repositoryName,
          url: source.url,
          githubUrl: source.githubUrl,
          installs: 0,
          recipes: [],
          packageSkills: [],
          contextSkills: [],
        };
        byRepository.set(source.repository, repository);
      }
      repository.recipes.push(source);
      repository.packageSkills.push(...source.packageSkills);
      repository.contextSkills.push(...source.contextSkills);
      repository.installs += source.installs;
    }
    const repositories = [...byRepository.values()].sort(
      (a, b) => b.installs - a.installs || a.repository.localeCompare(b.repository),
    );
    for (const repository of repositories) {
      repository.packageSkills.sort(bySkillRank);
      repository.contextSkills.sort(bySkillRank);
    }

    const ownerNames = [...new Set(sources.map((source) => source.owner))];
    const owners = ownerNames.map((name): CatalogOwner => {
      const ownerRepositories = repositories.filter((repository) => repository.owner === name);
      const ownerPackageSkills = ownerRepositories.flatMap((repository) => repository.packageSkills);
      const ownerContextSkills = ownerRepositories.flatMap((repository) => repository.contextSkills);
      return {
        name,
        url: `/${name}`,
        githubUrl: `https://github.com/${name}`,
        installs: ownerRepositories.reduce((total, item) => total + item.installs, 0),
        repositories: ownerRepositories,
        packageSkills: ownerPackageSkills,
        contextSkills: ownerContextSkills,
      };
    });
    return { sources, repositories, packageSkills, contextSkills, owners };
  })();
  return catalogPromise;
};

export const formatInstalls = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return new Intl.NumberFormat("en-US").format(value);
};
