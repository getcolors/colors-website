#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "scripts", "agent-skills.json");
const outputDir = join(root, "public", ".well-known", "agent-skills");
const update = process.argv.includes("--update");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`,
    );
  }
  return result;
};

const parseFrontmatter = (source, sourcePath) => {
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error(`${sourcePath} has no YAML frontmatter`);

  const fields = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-zA-Z][\w-]*):\s*(.+)$/);
    if (field) fields[field[1]] = field[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.name ?? "")) {
    throw new Error(`${sourcePath} has an invalid or missing skill name`);
  }
  if (!fields.description || fields.description.length > 1024) {
    throw new Error(`${sourcePath} has an invalid or missing description`);
  }
  return { name: fields.name, description: fields.description };
};

const fetchTo = async (url, destination) => {
  const response = await fetch(url, {
    headers: { "User-Agent": "getcolors-agent-skills-generator" },
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
};

const config = JSON.parse(await readFile(configPath, "utf8"));

if (update) {
  for (const [repository, pin] of Object.entries(config.repositories)) {
    const result = run("git", [
      "ls-remote",
      `https://github.com/getcolors/${repository}.git`,
      `refs/heads/${pin.ref}`,
    ]);
    const sha = result.stdout.trim().split(/\s+/)[0];
    if (!/^[0-9a-f]{40}$/.test(sha)) {
      throw new Error(`Could not resolve getcolors/${repository}@${pin.ref}`);
    }
    pin.sha = sha;
  }
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

const temp = await mkdtemp(join(tmpdir(), "colors-agent-skills-"));
try {
  const checkouts = new Map();
  for (const [repository, pin] of Object.entries(config.repositories)) {
    if (!/^[0-9a-f]{40}$/.test(pin.sha)) {
      throw new Error(`Invalid SHA for getcolors/${repository}`);
    }

    const archive = join(temp, `${repository}.tar.gz`);
    const checkout = join(temp, repository);
    await mkdir(checkout);
    await fetchTo(
      `https://codeload.github.com/getcolors/${repository}/tar.gz/${pin.sha}`,
      archive,
    );
    run("tar", ["-xzf", archive, "--strip-components=1", "-C", checkout]);
    checkouts.set(repository, checkout);
  }

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const entries = [];
  const names = new Set();
  for (const skill of config.skills) {
    if (!checkouts.has(skill.repository)) {
      throw new Error(`Unknown repository ${skill.repository}`);
    }
    if (skill.type !== "archive" && skill.type !== "skill-md") {
      throw new Error(`Unsupported artifact type ${skill.type}`);
    }

    const skillDir = join(checkouts.get(skill.repository), skill.path);
    const skillMdPath = join(skillDir, "SKILL.md");
    const skillMd = await readFile(skillMdPath, "utf8");
    const metadata = parseFrontmatter(skillMd, skillMdPath);
    if (names.has(metadata.name)) throw new Error(`Duplicate skill ${metadata.name}`);
    names.add(metadata.name);

    let artifact;
    let url;
    if (skill.type === "archive") {
      const tarPath = join(temp, `${metadata.name}.tar`);
      run("tar", [
        "--sort=name",
        "--mtime=@0",
        "--owner=0",
        "--group=0",
        "--numeric-owner",
        "--format=ustar",
        "-cf",
        tarPath,
        "-C",
        skillDir,
        ".",
      ]);
      const compressed = run("gzip", ["-n", "-9", "-c", tarPath], {
        encoding: null,
      });
      artifact = compressed.stdout;
      const digest = sha256(artifact);
      const filename = `${metadata.name}-${digest}.tar.gz`;
      await writeFile(join(outputDir, filename), artifact);
      url = `/.well-known/agent-skills/${filename}`;
    } else {
      artifact = Buffer.from(skillMd);
      const digest = sha256(artifact);
      const directory = join(outputDir, `${metadata.name}-${digest}`);
      await mkdir(directory);
      await writeFile(join(directory, "SKILL.md"), artifact);
      url = `/.well-known/agent-skills/${metadata.name}-${digest}/SKILL.md`;
    }

    entries.push({
      name: metadata.name,
      type: skill.type,
      description: metadata.description,
      url,
      digest: `sha256:${sha256(artifact)}`,
    });
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  const index = {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: entries,
  };
  await writeFile(join(outputDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);

  const files = await readdir(outputDir, { recursive: true });
  console.log(`Generated ${entries.length} skills (${files.length} files) in ${outputDir}`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
