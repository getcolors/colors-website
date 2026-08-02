// The landing page's copy, in one place.
//
// Two routes render this: src/pages/index.astro (the page) and
// src/pages/index.md.ts (the markdown twin Caddy serves to agents that send
// `Accept: text/markdown`). They used to hold two hand-maintained copies of
// the same prose, and they drifted twice — most visibly when b761193 put the
// real colors.yml in the hero and left the twin advertising a schema the
// product no longer accepts.
//
// Prose is authored in **markdown**, because the twin is a verbatim consumer.
// The page runs it through `html()` below, which drops the code ticks and
// turns bold into <strong> — so a string written once renders correctly in
// both. Only two inline markers are supported; this is deliberately not a
// markdown parser.

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Inline markdown → HTML. Safe for `set:html`: the input is the copy in this
 *  file, never anything from a request. */
export const html = (s: string) =>
  escape(s)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

export const meta = {
  title: "Colors — An SDK for Package Skills",
  description:
    "Colors is an SDK for building Package Skills. Three libraries — red, green and blue — give agents dry-run guarantees, secret indirection, and strict lifecycle control over real infrastructure.",
};

// The one string CLAUDE.md tracks across the repo. Every on-page occurrence now
// resolves to this constant; the og:image bakes its own copy in
// scripts/generate-og-image.py, which no build step can reach.
export const installCmd = "npx skills use getcolors/once";

// The real config that deploys this site — see the Deployment section of
// CLAUDE.md. Rendered by Shiki in the hero and fenced in the markdown twin.
export const colorsYml = `profile: once-colors
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
compute-prevent-destroy: true`;

export const nav = [
  { label: "Libraries", href: "#libraries" },
  { label: "K3s", href: "#k3s" },
  { label: "ClickHouse", href: "#clickhouse" },
  { label: "Airflow", href: "#airflow" },
  { label: "Once", href: "#once" },
  { label: "Walter", href: "#walter" },
];

export const hero = {
  eyebrow: "An SDK for Package Skills",
  headline: "Colors is an SDK for building Package Skills.",
  lede: "Three libraries — red, green, and blue — give agents dry-run guarantees, secret indirection, and strict lifecycle control over real infrastructure, in the runtime your team already uses.",
  installNote:
    "Run inside your coding agent — it grants **Once**, a skill to provision a VPS with a personal PaaS like Netlify or Vercel.",
  ymlCaption: "# colors.yml",
};

export const primitive = {
  heading: "A different primitive for a different job",
  lede: "Web automation and infrastructure automation demand different guarantees.",
  cards: [
    {
      label: "Browser Skill",
      title: "Eyes and hands on the web",
      body: "Navigates DOM elements, fills forms, scrapes content — bridges natural language intent with web interaction.",
      accent: false,
    },
    {
      label: "Package Skill",
      title: "Determinism and lifecycle control",
      body: "Provisions platforms, infrastructures, and containers — with dry-run boundaries and strict credential handling instead of raw shell access.",
      accent: true,
    },
  ],
};

export const bundles = {
  heading: "What a Package Skill bundles",
  cards: [
    {
      label: "Desired state",
      title: "Non-secret desired state",
      body: "`colors.yml` declares hostnames, DNS zones, and mail domains directly — no separate settings to keep in sync.",
    },
    {
      label: "Runtimes",
      title: "Deterministic runtimes & launchers",
      body: "Colors’ three pinned runtimes — Bun, Babashka, or uv — not ad-hoc shell scripts.",
    },
    {
      label: "Credentials",
      title: "Environment & credential boundaries",
      body: "Secrets stay in `COLORS_PAR_*` env vars, referenced by name and never rendered into files.",
    },
  ],
};

export const libraries = {
  heading: "Three libraries. One SDK.",
  lede: "Colors is an SDK made of three interchangeable libraries for building Package Skills. Pick the runtime your team already uses — the guarantees don't change: dry-run boundaries, secret indirection, identical desired-state semantics.",
  items: [
    {
      name: "red",
      stack: "TypeScript / Bun",
      blurb: "Build Package Skills with a fast TypeScript/Bun runtime.",
      url: "https://github.com/getcolors/red",
      accent: "var(--red)",
    },
    {
      name: "green",
      stack: "Clojure / Babashka",
      blurb: "Build Package Skills with Clojure over Babashka.",
      url: "https://github.com/getcolors/green",
      accent: "var(--green)",
    },
    {
      name: "blue",
      stack: "Python / uv",
      blurb: "Build Package Skills with Python, managed by uv.",
      url: "https://github.com/getcolors/blue",
      accent: "var(--blue)",
    },
  ],
};

// The create/build DAG, in render order. `group` stacks its nodes to mark them
// as running in parallel; `branch` is the ansible pair, where github follows
// ansible-remote alone and so needs a second grid column on that row only.
export type DagItem =
  | { kind: "node"; label: string; dark?: true }
  | { kind: "edge" }
  | { kind: "group"; nodes: string[] }
  | { kind: "branch"; nodes: string[]; tail: string };

// A panel may hold more than one graph. K3s, ClickHouse, Airflow and Once each
// need a single one; Walter's power verbs are two separate graphs under one caption,
// because `stop` and `start` are the pair that distinguishes it.
export type DagPanel = { caption: string; graphs: DagItem[][] };

export const k3sInstallCmd = "npx skills use getcolors/k3s";

export const k3s = {
  eyebrow: "Example Package Skill",
  heading: "K3s: a GitOps Kubernetes server, built with Colors",
  lede: "K3s is a Package Skill built with Colors. It provisions one Hetzner Cloud VPS behind a default-deny firewall, installs pinned K3s and Flux releases, and continuously reconciles a public Git repository without exposing the Kubernetes API.",
  runtimeNote:
    "K3s ships in **green** alone. Its launcher, desired state, dry-run boundary, and lifecycle graph use the same Colors SDK contracts as a three-colour package.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins the server shape, K3s and Flux versions, state backend, and public GitOps repository.",
    },
    {
      title: "Resolve secrets",
      body: "Hetzner, R2, and optional Cloudflare credentials arrive through `COLORS_PAR_*`; none are rendered under `.colors/`.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds OpenTofu and Ansible files, then runs `create --dry-run` before any provider or host is contacted.",
    },
    {
      title: "Provision securely",
      body: "OpenTofu creates the VPS and firewall; Ansible installs K3s and keeps API port `6443` private behind SSH.",
    },
    {
      title: "Reconcile GitOps",
      body: "Flux pulls applications and add-ons from Git. ExternalDNS and cert-manager can converge wildcard DNS and TLS without a kubeconfig in CI.",
    },
  ],
  dagCaption: "K3s — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "k3s-compute" },
    { kind: "edge" },
    { kind: "group", nodes: ["k3s-ansible-local", "k3s-ansible-remote"] },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `k3s-compute` → (`k3s-ansible-local`, `k3s-ansible-remote`).",
  dagNote:
    "The remote branch installs K3s and Flux and waits for the GitOps repository; the local branch writes the SSH alias. `./green kubectl` then crosses an SSH tunnel instead of publishing port 6443. Delete removes the alias before destroying the firewall and server, and the committed guard refuses accidental destruction.",
};

export const clickhouseInstallCmd = "npx skills use getcolors/clickhouse";

export const clickhouse = {
  eyebrow: "Example Package Skill",
  heading: "ClickHouse: a private analytics stack, built with Colors",
  lede: "ClickHouse is a Package Skill built with Colors. It provisions a three-node replicated ClickHouse cluster with a three-member Keeper quorum, plus a separate Metabase and PostgreSQL server, on Hetzner Cloud.",
  runtimeNote:
    "ClickHouse ships in **green** alone. ClickHouse, Keeper, and Metabase stay closed to the public internet; local dbt and browser traffic cross WireGuard.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins four server shapes, ClickHouse, Metabase, PostgreSQL and dbt versions, private networks, DNS, and the state backend.",
    },
    {
      title: "Resolve secrets",
      body: "Hetzner, Cloudflare, R2, ClickHouse, and Metabase credentials arrive through `COLORS_PAR_*`; deployment SSH and WireGuard private keys are generated and retained outside remote state.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds OpenTofu, Ansible, WireGuard, and dbt files, then runs `create --dry-run` before contacting any provider or server.",
    },
    {
      title: "Provision privately",
      body: "OpenTofu creates all four servers in parallel behind a default-deny firewall; split Ansible stages then configure ClickHouse and Metabase concurrently after WireGuard is ready.",
    },
    {
      title: "Prove the data path",
      body: "Local dbt tests replicated tables, acceptance queries them through Metabase and checks public-port isolation, then zero-change OpenTofu plans prove convergence.",
    },
  ],
  dagCaption: "ClickHouse — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "network" },
    { kind: "edge" },
    { kind: "node", label: "access" },
    { kind: "edge" },
    { kind: "group", nodes: ["node-1", "node-2", "node-3", "metabase"] },
    { kind: "edge" },
    { kind: "node", label: "firewall" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible-render" },
    { kind: "edge" },
    { kind: "node", label: "wireguard" },
    { kind: "edge" },
    { kind: "group", nodes: ["clickhouse-config", "metabase-config"] },
    { kind: "edge" },
    { kind: "node", label: "dbt" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
    { kind: "edge" },
    { kind: "node", label: "drift" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `network` → `access` → (`node-1`, `node-2`, `node-3`, `metabase`) → `firewall` → `dns` → `ansible-render` → `wireguard` → (`clickhouse-config`, `metabase-config`) → `dbt` → `acceptance` → `drift`.",
  dagNote:
    "The shared firewall exposes only SSH, ICMP, and WireGuard UDP. Acceptance verifies Keeper, replicas, dbt, Metabase, DNS, VPN reachability, and public-port isolation; the drift stage requires every OpenTofu plan to be empty. Delete reverses the graph with parallel DNS/firewall and server teardown, while destroy protection refuses accidents.",
};

export const airflowInstallCmd = "npx skills use getcolors/airflow";

export const airflow = {
  eyebrow: "Example Package Skill",
  heading: "Airflow: a production scheduler, built with Colors",
  lede: "Airflow is a Package Skill built with Colors. It provisions one VPS running Apache Airflow with LocalExecutor, host Postgres, continuous WAL-G backups, Caddy authentication and TLS, and a private GitHub repository that deploys DAGs over a confined rsync key.",
  runtimeNote:
    "Airflow ships in **green** alone. Its launcher, desired state, dry-run boundary, and lifecycle graph use the same Colors SDK contracts as the other Package Skills.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins the server, Airflow and Postgres versions, hostname, DAG repository, and backup policy.",
    },
    {
      title: "Resolve secrets",
      body: "Provider, database, Airflow, backup, and GitHub credentials arrive through `COLORS_PAR_*`; none are rendered under `.colors/`.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds OpenTofu, Ansible, and repository seed files, then runs `create --dry-run` before contacting a provider or host.",
    },
    {
      title: "Provision safely",
      body: "OpenTofu creates compute, SMTP, and DNS; Ansible installs Docker, Postgres, WAL-G, Airflow, Caddy, and the deploy account.",
    },
    {
      title: "Deploy DAGs",
      body: "A private repository pushes DAGs over `rrsync`; its write-only key is confined to one directory and has no shell or sudo access.",
    },
  ],
  dagCaption: "Airflow — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "airflow-compute" },
    { kind: "edge" },
    { kind: "node", label: "tofu-smtp" },
    { kind: "edge" },
    { kind: "node", label: "tofu-dns" },
    { kind: "edge" },
    { kind: "node", label: "tofu-smtp-post" },
    { kind: "edge" },
    {
      kind: "branch",
      nodes: ["airflow-ansible-local", "airflow-ansible-remote"],
      tail: "airflow-github",
    },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `airflow-compute` → `tofu-smtp` → `tofu-dns` → `tofu-smtp-post` → (`airflow-ansible-local`, `airflow-ansible-remote`), and `airflow-ansible-remote` → `airflow-github`.",
  dagNote:
    "GitHub follows the remote stage because seeding the repository immediately triggers its deploy workflow, so the matching public key must already be installed. Delete revokes the credential first, removes the local SSH alias, then tears down SMTP, DNS, and compute; it deliberately keeps the DAG repository and the WAL-G archive.",
};

export const once = {
  eyebrow: "Example Package Skill",
  heading: "Once: a personal PaaS, built with Colors",
  lede: "Once is a Package Skill built with Colors. It provisions a VPS, configures DNS and outgoing mail, installs Docker, and reconciles declared applications — a self-hosted alternative to Netlify or Vercel that an agent runs end to end.",
  // The counterpart to the green-only K3s and Walter runtime notes. Together
  // they make the three-library claim concrete: Once uses all three while a
  // Package Skill remains free to choose one.
  runtimeNote:
    "Once ships in all three colours — **red**, **green** and **blue** are interchangeable managers of the same OpenTofu state, from one `colors.yml`.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. Hostnames determine DNS zones and mail domains.",
    },
    {
      title: "Resolve secrets",
      body: "Env map points to `COLORS_PAR_*` variables, deferred until runtime.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds files under `.colors/` and runs `create --dry-run`, touching nothing live.",
    },
    {
      title: "Provision & reconcile",
      body: "OpenTofu provisions compute/SMTP/DNS; Ansible configures local and remote hosts.",
    },
  ],
  dagCaption: "Once — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "group", nodes: ["tofu-compute", "tofu-smtp"] },
    { kind: "edge" },
    { kind: "node", label: "tofu-dns" },
    { kind: "edge" },
    { kind: "node", label: "tofu-smtp-post" },
    { kind: "edge" },
    { kind: "branch", nodes: ["ansible-local", "ansible-remote"], tail: "github" },
  ] satisfies DagItem[],
  // Prose form of the graph above. The page draws the boxes instead, so this
  // one line is the twin's only addition rather than a duplicate.
  dagSummary:
    "The create/build DAG runs `start` → (`tofu-compute`, `tofu-smtp`) → `tofu-dns` → `tofu-smtp-post` → (`ansible-local`, `ansible-remote`), and `ansible-remote` → `github`.",
  dagNote:
    "Publishing follows the remote stage, not the local one: the deploy keys describe a configured host, so a workstation-side failure does not gate them. Delete reverses the graph — it withdraws the published credentials first, then cleanup, SMTP post and DNS, then SMTP and compute in parallel. Step failures travel as namespaced exit codes, never uncaught exceptions.",
};

// Walter's own install line. Deliberately not the `installCmd` constant: that
// one is the page's primary call to action and is baked into the og:image by
// scripts/generate-og-image.py, which no build step can reach. Once stays the
// headline skill; this command appears only inside Walter's own section.
export const walterInstallCmd = "npx skills use getcolors/walter";

export const walter = {
  eyebrow: "Example Package Skill",
  heading: "Walter: a remote dev machine, built with Colors",
  lede: "Walter is another Package Skill built with Colors. It provisions one development machine, records it in `~/.ssh/config` so `ssh <profile>` reaches it, and powers it off and on — so the machine you code on costs nothing while you sleep.",
  // The three-library pitch is about choice, not obligation, and saying so
  // plainly is better than letting a reader assume Walter ships in all three.
  runtimeNote:
    "Walter ships in **green** alone. A Package Skill picks the runtime that suits it — the SDK offers three, it does not demand all three.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. `profile` names the work directory, the state keys, and the `~/.ssh/config` alias.",
    },
    {
      title: "Resolve secrets",
      body: "State-backend keys come from `COLORS_PAR_*`. OCI authenticates from `~/.oci/config`, so no token is written anywhere.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds files under `.colors/` and runs `create --dry-run`, touching nothing live.",
    },
    {
      title: "Provision",
      body: "OpenTofu provisions the machine; Ansible writes the ssh alias and confirms it answers.",
    },
    // Sits after provisioning and before the power verbs because that is the
    // order it happens in: the toolchain is installed over the same Ansible
    // connection, and only then is there a machine worth stopping.
    {
      title: "Install, then power",
      body: "The same `colors.yml` names nix packages, a login shell and asdf runtimes. `stop` and `start` take it from there.",
    },
  ],
  dags: [
    {
      caption: "Walter — CREATE / BUILD DAG",
      graphs: [
        [
          { kind: "node", label: "start", dark: true },
          { kind: "edge" },
          { kind: "node", label: "compute" },
          { kind: "edge" },
          { kind: "group", nodes: ["ansible-local", "ansible-remote"] },
        ],
      ],
    },
    {
      caption: "Walter — STOP / START",
      graphs: [
        [
          { kind: "node", label: "start", dark: true },
          { kind: "edge" },
          { kind: "node", label: "power-off" },
        ],
        [
          { kind: "node", label: "start", dark: true },
          { kind: "edge" },
          { kind: "node", label: "power-on" },
          { kind: "edge" },
          { kind: "node", label: "ansible-local" },
        ],
      ],
    },
  ] satisfies DagPanel[],
  // Prose form of the graphs above, for the markdown twin. `start` is both a
  // step name and a command name, so the commands are named explicitly.
  dagSummary:
    "The create/build DAG runs `start` → `compute` → (`ansible-local`, `ansible-remote`). The `stop` command runs `start` → `power-off`; the `start` command runs `start` → `power-on` → `ansible-local`.",
  dagNote:
    "Stop and start never reach OpenTofu. No template declares a power state, so powering the machine down out of band causes no drift — there is nothing to reconcile, because power was never managed. Starting reads the address back from the provider rather than from stored state, which a power cycle does not refresh. Delete reverses the create graph, dropping the managed ssh alias before anything is destroyed.",
};

export const cta = {
  heading: "Give your agent a new skill to create a personal PaaS.",
  lede: "Dry-run first. Approve. Then provision — with Once, built with Colors. Paste this into your coding agent.",
};

export const footer = {
  name: "Colors",
  href: "https://github.com/getcolors",
  label: "GitHub",
};
