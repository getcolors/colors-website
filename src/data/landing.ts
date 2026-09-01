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
  title: "Colors — Reproducible self-hosted deployments",
  description:
    "Colors turns a small desired-state file into an inspectable OpenTofu and Ansible deployment. Build and dry-run locally, then provision infrastructure in your own cloud account.",
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
  { label: "Featured", href: "/featured" },
  { label: "Catalog", href: "/skills" },
  { label: "Blog", href: "/blog" },
];

export const hero = {
  eyebrow: "Open-source deployment packages",
  headline: "From colors.yml to a running server.",
  lede: "Colors packages OpenTofu and Ansible into reproducible deployments you can inspect before they run. Your infrastructure stays in your cloud account, and your credentials stay local.",
  installNote:
    "Try **Once**: provision a VPS, DNS, outgoing mail, Docker, HTTPS, and declared applications from one desired-state file.",
  ymlCaption: "# The real colors.yml that deploys this site",
};

export const packageSkillDefinition =
  "A Package Skill is a deterministic infrastructure and platform automation module built for AI coding agents using the Colors SDK (available in TypeScript/Bun, Clojure/Babashka, or Python/uv). It provisions and manages production resources—such as Kubernetes clusters, databases, dev machines, or personal PaaS environments—by reading a non-secret desired state file (`colors.yml`), enforcing mandatory dry-run boundaries before contacting live providers, maintaining strict credential indirection through environment variables (`COLORS_PAR_*`), and managing resource lifecycles through execution graphs (DAGs).";

export const workflow = {
  heading: "See exactly what happens before anything happens",
  lede: "Every deployment uses the same explicit lifecycle. The first two commands are safe on a fresh checkout with no provider credentials.",
  steps: [
    {
      command: "./green build",
      title: "Render locally",
      body: "Validate `colors.yml` and generate the OpenTofu, Ansible, and supporting files under `.colors/`.",
    },
    {
      command: "./green create --dry-run",
      title: "Walk the complete plan",
      body: "Traverse the deployment graph while skipping every provider call and remote side effect.",
    },
    {
      command: "./green create",
      title: "Provision and verify",
      body: "Converge the declared infrastructure, configure the hosts, and run the package’s acceptance checks.",
    },
  ],
};

export const realExample = {
  eyebrow: "Real-life example",
  heading: "Deploy an application on your own VPS with Basecamp ONCE",
  lede: "The configuration shown above is not a mock-up: it deploys this website with the Once Package Skill, an implementation of Basecamp’s production single-server ONCE workflow. Starting with an OCI account and a domain, it creates the server and connects every layer needed to serve the application.",
  results: [
    "Provisions the VPS with OpenTofu",
    "Configures Docker and the host with Ansible",
    "Creates Cloudflare DNS and Resend mail settings",
    "Serves the declared container over HTTPS",
  ],
  note: "There is no Colors dashboard or long-running Colors control plane on the server. Once the workflow finishes, the VPS and provider resources remain yours.",
};

export const difference = {
  heading: "Why not use the existing tools directly?",
  lede: "You can. Colors is useful when you want a tested, opinionated path through them rather than assembling and maintaining every layer yourself.",
  cards: [
    {
      label: "Versus an install script",
      title: "Desired state, not curl-to-shell",
      body: "Inputs are validated, generated infrastructure is inspectable, repeated runs converge, and deletion follows an explicit guarded graph.",
    },
    {
      label: "Versus raw IaC",
      title: "A packaged operational path",
      body: "A Package Skill bundles provider resources, host configuration, credential boundaries, ordering, and acceptance checks behind one lifecycle.",
    },
    {
      label: "Versus a self-hosted PaaS",
      title: "No permanent control panel",
      body: "Colors provisions the infrastructure and exits. It can deploy a personal PaaS such as Once; it does not manage applications through a web dashboard.",
    },
  ],
};

export const trust = {
  heading: "Inspect it. Keep it. Leave it.",
  cards: [
    {
      label: "Visible automation",
      title: "OpenTofu and Ansible stay inspectable",
      body: "`build` renders the files locally before `create` is allowed to contact a provider or host.",
    },
    {
      label: "Local credentials",
      title: "Secrets never belong in `colors.yml`",
      body: "Credentials arrive through local `COLORS_PAR_*` environment variables and are not rendered into generated files.",
    },
    {
      label: "Deterministic execution",
      title: "No model provisions your server",
      body: "A coding agent can install and operate a Package Skill, but the launcher itself is ordinary deterministic code and makes no LLM calls.",
    },
    {
      label: "Honest fit",
      title: "Not for every self-hoster",
      body: "If you want a dashboard for an existing homelab, or already prefer maintaining all your IaC directly, Colors may add no value.",
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
      docsUrl: "https://getcolors.github.io/red/",
      repoUrl: "https://github.com/getcolors/red",
      accent: "var(--red)",
    },
    {
      name: "green",
      stack: "Clojure / Babashka",
      blurb: "Build Package Skills with Clojure over Babashka.",
      docsUrl: "https://getcolors.github.io/green/",
      repoUrl: "https://github.com/getcolors/green",
      accent: "var(--green)",
    },
    {
      name: "blue",
      stack: "Python / uv",
      blurb: "Build Package Skills with Python, managed by uv.",
      docsUrl: "https://getcolors.github.io/blue/",
      repoUrl: "https://github.com/getcolors/blue",
      accent: "var(--blue)",
    },
  ],
};

// The 2×2 the four Agent Skill sections spell out: two verbs (create, submit)
// by two skill kinds (Package, Context). Each cell links to its full section,
// so the hrefs must match those sections' anchors.
export const skillMatrix = {
  heading: "Four Agent Skills, two verbs, two kinds",
  lede: "A Package Skill provisions infrastructure; a Context Skill remembers what a verified build learned. Each kind can be created with your agent, and each can be submitted to the Skills Catalog — four workflows that pair up into a matrix.",
  columns: ["Package Skill", "Context Skill"],
  rows: [
    {
      verb: "Create",
      cells: [
        {
          title: "Create Package Skill",
          body: "Build a new Package Skill and a deployment that uses it.",
          href: "#create-package-skill",
        },
        {
          title: "Create Context Skill",
          body: "Distill a completed, verified build into routed knowledge.",
          href: "#create-context-skill",
        },
      ],
    },
    {
      verb: "Submit",
      cells: [
        {
          title: "Submit Package Skill",
          body: "Validate an existing Package Skill and add its recipe to the Catalog.",
          href: "#submit-package-skill",
        },
        {
          title: "Submit Context Skill",
          body: "Validate against the Context Skill Standard and add its recipe.",
          href: "#submit-context-skill",
        },
      ],
    },
  ],
};

export const createPackageSkillCmd =
  'npx skills use "https://github.com/getcolors/skills" --skill "create-package-skill"';

export const createPackageSkillPrompt =
  `Run \`${createPackageSkillCmd}\` and read its complete output, redirecting it to a temporary file first if necessary. It is a phased workflow that begins with conversation only: your first reply asks the user for the Package Skill folder name and the deployment suffix, then settles scope, credentials, cost, and authorization. Create no files, write no plan, and run no state-changing command until the workflow's own phase gates say so.`;

export const createPackageSkill = {
  eyebrow: "Agent Skill",
  docsUrl: "https://getcolors.github.io/skills/",
  repoUrl: "https://github.com/getcolors/skills",
  heading: "Create Package Skill: build a new Package Skill with your agent",
  lede: "Create Package Skill gives a coding agent the workflow for building a new Colors Package Skill and a deployment that uses it — from requirements and credential boundaries through implementation, safe dry runs, and an authorized production deployment.",
  useNote:
    "This is an **Agent Skill**, not a Package Skill. `npx skills use` gives it to your agent for the next request without installing it into a project.",
  phases: [
    {
      title: "Define",
      body: "Agree on names, behavior, acceptance criteria, deployment target, credentials, cost, and authorization before touching files.",
    },
    {
      title: "Scaffold safely",
      body: "Create only non-secret desired state and credential placeholders, then stop for review. Secrets never enter chat or tracked files.",
    },
    {
      title: "Build and deploy",
      body: "Implement autonomously, test every layer, use real SHA pins, preserve safety guards, and deploy only within explicit authorization.",
    },
  ],
};

export const submitPackageSkillCmd =
  'npx skills add "https://github.com/getcolors/skills" --skill "submit-package-skill"';

export const submitPackageSkillPrompt =
  `Run \`${submitPackageSkillCmd.replace(/^npx skills add\b/, "npx skills use")}\` and read its complete output, redirecting it to a temporary file first if necessary. It validates an existing Package Skill and adds it to the getcolors.ai Catalog. Validate fully and prepare the recipe, but branch, commit, push, and open the pull request only with the user's explicit authorization.`;

export const submitPackageSkill = {
  eyebrow: "Agent Skill",
  docsUrl: "https://github.com/getcolors/skills/blob/main/submit-package-skill/SKILL.md",
  repoUrl: "https://github.com/getcolors/skills",
  heading: "Submit Package Skill: add an existing Package Skill to the Catalog",
  lede: "Submit Package Skill gives a coding agent the workflow for validating an existing Colors Package Skill, adding its catalog recipe, and opening an authorized pull request for curated discovery on getcolors.ai.",
  useNote:
    "This is an **Agent Skill**, not a Package Skill. The Catalog adds discoverability only: GitHub remains the source, and `npx skills` remains the installer.",
  phases: [
    {
      title: "Validate",
      body: "Inspect every SKILL.md and verify the Colors runtime, desired state, dry-run boundary, credential indirection, and lifecycle DAGs.",
    },
    {
      title: "Add the recipe",
      body: "Create one validated recipe for the product, grouping interchangeable runtime variants and infrastructure-oriented search keywords.",
    },
    {
      title: "Open the PR",
      body: "Run catalog validation and the site build, then create a branch, commit, push, fork, or pull request only with explicit authorization.",
    },
  ],
};

// `use`, not `add`, matching createPackageSkillCmd: the markdown twin fences
// this verbatim, and create-package-skill's "Optional distillation" section
// advertises the same `use` verb. InstallBox derives both tabs either way.
export const createContextSkillCmd =
  'npx skills use "https://github.com/getcolors/skills" --skill "create-context-skill"';

export const createContextSkillPrompt =
  `Run \`${createContextSkillCmd}\` and read its complete output, redirecting it to a temporary file first if necessary. Its input is a completed, verified build whose acceptance gates passed — ideally the one still in this session, whose verbatim failures, deviations, and pinned versions have not yet decayed. Distill only knowledge bought from converging against the real platform; if no verified build exists here, say so and stop rather than writing from research or documentation.`;

export const createContextSkill = {
  eyebrow: "Agent Skill",
  docsUrl: "https://github.com/getcolors/skills/blob/main/create-context-skill/SKILL.md",
  repoUrl: "https://github.com/getcolors/skills",
  heading: "Create Context Skill: distill a verified build into a Context Skill",
  lede: "Create Context Skill gives a coding agent the workflow for distilling a completed, verified build into a Context Skill conforming to the Context Skill Standard — symptom-first routing, provenance-labelled claims, pinned versions, a failure catalogue, and evals, with no copies of the companion package's files.",
  useNote:
    "This is an **Agent Skill**, not a Package Skill. Its input is a completed build whose acceptance gates passed — without one, there is nothing to distill.",
  phases: [
    {
      title: "Harvest",
      body: "Collect verbatim failures, review dispositions, deviations from documentation, and the exact pinned versions while the build's session still holds them.",
    },
    {
      title: "Structure and route",
      body: "Write the why into the body and the reference material into references, keep every claim provenance-labelled, and copy no file the companion package owns.",
    },
    {
      title: "Prove and hand off",
      body: "Write user-in-trouble evals, pass `skills-ref validate`, and stop: committing, pushing, and the catalog pull request each need explicit authorization.",
    },
  ],
};

export const submitContextSkillCmd =
  'npx skills add "https://github.com/getcolors/skills" --skill "submit-context-skill"';

export const submitContextSkillPrompt =
  `Run \`${submitContextSkillCmd.replace(/^npx skills add\b/, "npx skills use")}\` and read its complete output, redirecting it to a temporary file first if necessary. It validates a Context Skill against the Context Skill Standard and adds its \`type: context\` recipe to the getcolors.ai Catalog. Validate fully and prepare the recipe, but branch, commit, push, and open the pull request only with the user's explicit authorization.`;

export const submitContextSkill = {
  eyebrow: "Agent Skill",
  docsUrl: "https://github.com/getcolors/skills/blob/main/submit-context-skill/SKILL.md",
  repoUrl: "https://github.com/getcolors/skills",
  heading: "Submit Context Skill: add an existing Context Skill to the Catalog",
  lede: "Submit Context Skill gives a coding agent the workflow for validating a Context Skill — knowledge distilled from a verified build — against the Context Skill Standard, adding its catalog recipe, and opening an authorized pull request for curated discovery on getcolors.ai.",
  useNote:
    "This is an **Agent Skill**, not a Package Skill. A Context Skill carries symptom-routed traps and acceptance doctrine; the Catalog adds discoverability only, and `npx skills use` remains how an agent loads it.",
  phases: [
    {
      title: "Validate",
      body: "Read the skill and its references, run `skills-ref validate`, and verify symptom routing, provenance, pins, the failure catalogue, and evals.",
    },
    {
      title: "Add the recipe",
      body: "Create one `type: context` recipe naming the skill's repository, symptom-oriented search keywords, and the companion Package Skill it documents.",
    },
    {
      title: "Open the PR",
      body: "Run catalog validation and the site build, then create a branch, commit, push, fork, or pull request only with explicit authorization.",
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

// A panel may hold more than one graph. K8s, K3s, ClickHouse, Airflow, Rama,
// Once and Vaultwarden each need a single one; Walter's power verbs are two separate graphs under one
// caption, because `stop` and `start` are the pair that distinguishes it.
export type DagPanel = { caption: string; graphs: DagItem[][] };

export const k8sInstallCmd = "npx skills use getcolors/k8s";

export const k8s = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/k8s/",
  repoUrl: "https://github.com/getcolors/k8s",
  heading: "K8s: a kubeadm cluster on DigitalOcean, built with Colors",
  lede: "K8s is a Package Skill built with Colors. It provisions a two-node kubeadm cluster in a deployment-owned DigitalOcean VPC, installs pinned Flannel, DigitalOcean cloud-controller and Flux releases, and reconciles applications from a public Git repository.",
  runtimeNote:
    "K8s ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. Its launcher, desired state, validation, dry-run boundary, lifecycle graph, and guarded deletion use the same Colors SDK contracts as the other Package Skills.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins the control-plane and worker shapes, Kubernetes and component versions, network CIDRs, state backend, and GitOps repository.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean, Cloudflare, and remote-state credentials arrive through `COLORS_PAR_*`; tokens and kubeconfig never enter tracked or generated files.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu and Ansible files, then runs `create --dry-run` before any provider, node, DNS record, or load balancer is contacted.",
    },
    {
      title: "Bootstrap kubeadm",
      body: "OpenTofu creates the VPC, firewalls, control plane, and worker. Ansible installs containerd and kubeadm, joins the nodes, and keeps administrative access CIDR-restricted.",
    },
    {
      title: "Reconcile and verify",
      body: "Flux deploys controllers and applications from Git; the workflow waits for both nodes, DNS, TLS, the DigitalOcean load balancer, and the HTTPS health endpoint.",
    },
  ],
  dagCaption: "K8s — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "k8s-infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "k8s-ansible-local" },
    { kind: "edge" },
    { kind: "node", label: "k8s-ansible-remote" },
    { kind: "edge" },
    { kind: "node", label: "k8s-acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `k8s-infrastructure` → `k8s-ansible-local` → `k8s-ansible-remote` → `k8s-acceptance`.",
  dagNote:
    "Infrastructure is converged before kubeadm touches either node, and acceptance proves the GitOps application over valid HTTPS. Delete first reloads node addresses from remote state, asks Kubernetes to remove its DigitalOcean load balancer, drops the managed SSH alias, and only then reaches guarded infrastructure destruction.",
};

export const k3sInstallCmd = "npx skills use getcolors/k3s";

export const k3s = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/k3s/",
  repoUrl: "https://github.com/getcolors/k3s",
  heading: "K3s: a GitOps Kubernetes server, built with Colors",
  lede: "K3s is a Package Skill built with Colors. It provisions one Hetzner Cloud VPS behind a default-deny firewall, installs pinned K3s and Flux releases, and continuously reconciles a public Git repository without exposing the Kubernetes API.",
  runtimeNote:
    "K3s ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. Its launcher, desired state, dry-run boundary, and lifecycle graph use the same Colors SDK contracts in every colour.",
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
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/clickhouse/",
  repoUrl: "https://github.com/getcolors/clickhouse",
  heading: "ClickHouse: a private analytics stack, built with Colors",
  lede: "ClickHouse is a Package Skill built with Colors. It provisions a three-node replicated ClickHouse cluster with a three-member Keeper quorum, plus a separate Metabase and PostgreSQL server, on Hetzner Cloud.",
  runtimeNote:
    "ClickHouse ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. ClickHouse, Keeper, and Metabase stay closed to the public internet; local dbt and browser traffic cross WireGuard.",
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

export const umamiInstallCmd = "npx skills use getcolors/umami";

export const umami = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/umami/",
  repoUrl: "https://github.com/getcolors/umami",
  heading: "Umami: single-node web analytics, built with Colors",
  lede: "Umami is a Package Skill built with Colors. It provisions one DigitalOcean droplet running Umami web analytics with colocated PostgreSQL 17 behind Caddy, with restore-verified backups to Cloudflare R2.",
  runtimeNote:
    "Umami ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. Only Caddy's 80/443 are public; PostgreSQL and Umami's own port stay on the private Compose network.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins every image by tag, the droplet shape and region, DNS, backup schedule and retention, and the state backend. No secret appears in it.",
    },
    {
      title: "Resolve secrets",
      body: "Credentials arrive through `COLORS_PAR_*` from a gitignored `.envrc.private`, and are interpolated into the stack at converge time rather than rendered into `.colors/`.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds the OpenTofu and Ansible trees, then runs `create --dry-run` before contacting any provider or machine.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the droplet in the region's default VPC behind a firewall, publishes the Cloudflare record, then Ansible converges Docker Compose and issues TLS. The seeded admin password is rotated during the same run.",
    },
    {
      title: "Prove it works",
      body: "Acceptance verifies HTTPS with a real certificate, refuses to pass while the seeded credentials still authenticate, reads a synthetic event back out of PostgreSQL, and confirms a fresh backup object in R2.",
    },
  ],
  dagCaption: "Umami — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → `ansible` → `acceptance`, and delete reverses it so the application stops before its machine is destroyed.",
  dagNote:
    "Three containers: PostgreSQL, Umami and Caddy. Backups dump PostgreSQL nightly, restore each dump into a scratch database before uploading it, and prune R2 to the same horizon as local disk. `compute-prevent-destroy` refuses accidental deletion.",
};

export const rybbitInstallCmd = "npx skills use getcolors/rybbit";

export const rybbit = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/rybbit/",
  repoUrl: "https://github.com/getcolors/rybbit",
  heading: "Rybbit: hybrid OLTP and columnar analytics, built with Colors",
  lede: "Rybbit is a Package Skill built with Colors. It provisions one DigitalOcean droplet pairing PostgreSQL 17 for metadata and authentication with ClickHouse for columnar events, plus Redis and Caddy.",
  runtimeNote:
    "Rybbit ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. Only Caddy's 80/443 are public; PostgreSQL, ClickHouse, Redis and the Rybbit backend and client ports stay private.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins every image by tag, the droplet shape and region, DNS, backup schedule and retention, and the state backend. No secret appears in it.",
    },
    {
      title: "Resolve secrets",
      body: "Credentials arrive through `COLORS_PAR_*` from a gitignored `.envrc.private`, and are interpolated into the stack at converge time rather than rendered into `.colors/`.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds the OpenTofu and Ansible trees, then runs `create --dry-run` before contacting any provider or machine.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the droplet and firewall and publishes DNS; Ansible then generates the stack's database, cache and auth secrets on the machine, retains them, and converges six containers.",
    },
    {
      title: "Prove it works",
      body: "Acceptance verifies HTTPS with a real certificate, reads a synthetic pageview back out of ClickHouse, and confirms the backup drill left a fresh object in R2.",
    },
  ],
  dagCaption: "Rybbit — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → `ansible` → `acceptance`, and delete reverses it so the application stops before its machine is destroyed.",
  dagNote:
    "Six containers. Backups dump PostgreSQL and take a native ClickHouse `BACKUP` — never a hot copy of the data directory, which races running merges — restore the dump into a scratch database before uploading, and prune R2 alongside local disk.",
};

export const posthogInstallCmd = "npx skills use getcolors/posthog";

export const posthog = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/posthog/",
  repoUrl: "https://github.com/getcolors/posthog",
  heading: "PostHog: a product analytics suite on one machine, built with Colors",
  lede: "PostHog is a Package Skill built with Colors. It provisions one DigitalOcean droplet running the PostHog application, ClickHouse with embedded Keeper, Kafka, Temporal, a Rust capture service and a plugin server — the tiers PostHog cannot run without, reduced to a single node.",
  runtimeNote:
    "PostHog ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. Only Caddy's 80/443 are public; the ingestion path from capture through Kafka to ClickHouse stays on the private Compose network.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins every image by tag, the droplet shape and region, DNS, backup schedule and retention, and the state backend. No secret appears in it.",
    },
    {
      title: "Resolve secrets",
      body: "Credentials arrive through `COLORS_PAR_*` from a gitignored `.envrc.private`, and are interpolated into the stack at converge time rather than rendered into `.colors/`.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds the OpenTofu and Ansible trees, then runs `create --dry-run` before contacting any provider or machine.",
    },
    {
      title: "Provision and migrate",
      body: "OpenTofu creates the droplet and DNS; Ansible starts the datastores alone, restores a committed schema checkpoint when it matches the pinned image, and applies PostgreSQL and ClickHouse migrations before any application container starts.",
    },
    {
      title: "Prove ingestion",
      body: "Acceptance verifies HTTPS with a real certificate, posts a synthetic event and reads it back out of ClickHouse — distinguishing an accepted-but-unstored event from a stored one — and confirms a fresh backup object in R2.",
    },
  ],
  dagCaption: "PostHog — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → `ansible` → `acceptance`, and delete reverses it so the application stops before its machine is destroyed.",
  dagNote:
    "Ten containers. The application and plugin server are pinned to one upstream commit because they share a Postgres schema; a committed plain-SQL checkpoint replaces an hour of cold migrations, and is restored only when its stamped commit matches the image.",
};

export const airflowInstallCmd = "npx skills use getcolors/airflow";

export const airflow = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/airflow/",
  repoUrl: "https://github.com/getcolors/airflow",
  heading: "Airflow: a production scheduler, built with Colors",
  lede: "Airflow is a Package Skill built with Colors. It provisions one VPS running Apache Airflow with LocalExecutor, host Postgres, continuous WAL-G backups, Caddy authentication and TLS, and a private GitHub repository that deploys DAGs over a confined rsync key.",
  runtimeNote:
    "Airflow ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity by its own three-colour harness. Its launcher, desired state, dry-run boundary, and lifecycle graph use the same Colors SDK contracts as the other Package Skills.",
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

export const ramaInstallCmd = "npx skills use getcolors/rama";

export const rama = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/rama/",
  repoUrl: "https://github.com/getcolors/rama",
  heading: "Rama: a private distributed computing cluster, built with Colors",
  lede: "Rama is a Package Skill built with Colors. It provisions a private single-node Rama cluster on DigitalOcean with ZooKeeper, a Conductor and Supervisor, WireGuard access, and optional Cloudflare DNS and Resend mail.",
  runtimeNote:
    "Rama ships in **green** alone. Its launcher keeps Rama service ports off the public internet and configures the local Rama CLI to reach the cluster through WireGuard.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins the Droplet shape, Rama, ZooKeeper and Java versions, VPN network, optional hostname and mail domain, and state backend.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean, R2, optional Cloudflare and Resend credentials arrive through `COLORS_PAR_*`; the Rama license and generated WireGuard client remain outside tracked files and remote state.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu and Ansible files, then runs `create --dry-run` before any provider, server, DNS record, or mail domain is contacted.",
    },
    {
      title: "Provision privately",
      body: "OpenTofu creates the Droplet and default-deny firewall; Ansible installs WireGuard, ZooKeeper, Rama Conductor and Supervisor, exposing only SSH and the VPN publicly.",
    },
    {
      title: "Verify the cluster",
      body: "Acceptance checks every service, runs `conductorReady` and `numSupervisors` through the local Rama CLI, and proves Rama ports are unreachable from the public internet.",
    },
  ],
  dagCaption: "Rama — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "smtp" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "smtp-post" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `smtp` → `dns` → `smtp-post` → `ansible` → `acceptance`.",
  dagNote:
    "DNS and mail stages become no-ops when their providers are disabled. Delete reverses the graph, removing local and remote WireGuard configuration before infrastructure; the committed destroy guard refuses accidental deletion.",
};

export const restateInstallCmd = "npx skills use getcolors/restate";

export const restate = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/restate/",
  repoUrl: "https://github.com/getcolors/restate",
  heading: "Restate: durable workflows on one server, built with Colors",
  lede: "Restate is a Package Skill built with Colors. It provisions a production-oriented single-node Restate server and TypeScript reference application on DigitalOcean, with private service ports, public TLS, durable workflow recovery, and off-server backups.",
  runtimeNote:
    "Restate ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. Its acceptance workflow deliberately retries an activity and reboots the complete Droplet during a durable delay before verifying the final result.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins Restate, the TypeScript SDK, Caddy, Droplet sizing, backup policy, hostname, region, and state backend.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean, Cloudflare, remote-state, and backup credentials arrive through `COLORS_PAR_*`; no credential or generated `.colors/` content enters source control.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose, Caddy, and application files, then runs `create --dry-run` before contacting providers or the server.",
    },
    {
      title: "Provision privately",
      body: "OpenTofu discovers the regional default VPC, creates the Droplet, firewall, and apex DNS record; Ansible converges Restate, the application, Caddy, and scheduled R2 backups.",
    },
    {
      title: "Prove durability",
      body: "Acceptance checks HTTPS and duplicate IDs, starts a durable delay, reboots the Droplet, and verifies recovery, two failed activity attempts, attempt-three success, status, and deterministic result.",
    },
  ],
  dagCaption: "Restate — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → `ansible` → `acceptance`.",
  dagNote:
    "Restate ingress, administration, fabric, metrics, and SDK ports remain private. Delete reverses Ansible, DNS, and infrastructure while the committed destroy guard refuses accidents; external backup archives remain available for manual recovery.",
};

export const once = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/once/",
  repoUrl: "https://github.com/getcolors/once",
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

export const temporalInstallCmd = "npx skills use getcolors/temporal";

export const temporal = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/temporal/",
  repoUrl: "https://github.com/getcolors/temporal",
  heading: "Temporal: durable workflows on one production server, built with Colors",
  lede: "Temporal is a Package Skill built with Colors. It provisions one DigitalOcean Droplet running PostgreSQL, all four Temporal Server roles, a TypeScript reference API and worker, and Caddy with public TLS.",
  runtimeNote:
    "Temporal ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. The reference workflow uses a durable timer, retries an activity twice, rejects duplicate IDs, and returns a deterministic result after service or whole-Droplet restarts.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins Temporal Server and TypeScript SDK releases, PostgreSQL, Droplet shape, namespace, workflow delay, retry policy, DNS, TLS, backups, and state backend.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean, Cloudflare, and remote-state credentials arrive through `COLORS_PAR_*`; PostgreSQL credentials are generated and retained on the server rather than rendered under `.colors/`.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Docker Compose, and TypeScript application files, then runs `create --dry-run` before contacting a provider, host, or DNS zone.",
    },
    {
      title: "Provision privately",
      body: "OpenTofu discovers the Amsterdam region's existing default VPC, creates the guarded Droplet and firewall, and publishes apex DNS; PostgreSQL, Temporal, and administrative ports remain private.",
    },
    {
      title: "Prove durability",
      body: "Acceptance verifies HTTPS, workflow completion, intentional activity retries, duplicate rejection, deterministic status/results, and recovery when Docker or the entire Droplet restarts during the durable delay.",
    },
  ],
  dagCaption: "Temporal — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → `ansible` → `acceptance`.",
  dagNote:
    "The infrastructure stage discovers rather than creates the regional default VPC. Ansible initializes both Temporal PostgreSQL schemas before starting all server roles, the API and Caddy. Delete stops the stack, removes DNS, then reaches guarded infrastructure destruction; acceptance can separately reboot the whole Droplet mid-workflow.",
};

export const vaultwardenInstallCmd = "npx skills use getcolors/vaultwarden";

export const vaultwarden = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/vaultwarden/",
  repoUrl: "https://github.com/getcolors/vaultwarden",
  heading: "Vaultwarden: a recoverable password manager, built with Colors",
  lede: "Vaultwarden is a Package Skill built with Colors. It deploys the pinned public Vaultwarden image on a Basecamp ONCE server, sends the initial owner invitation, and continuously replicates SQLite to Cloudflare R2 for automatic recovery.",
  runtimeNote:
    "Vaultwarden ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. The public image needs no GitHub access; an operator-owned repository can opt into ONCE deployment credentials. Public signup and the steady-state admin endpoint stay disabled.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins the hostname and image, owner email, provider choices, R2 replica, retention, snapshot cadence, and weekly restore-check schedule.",
    },
    {
      title: "Resolve secrets",
      body: "Compute, DNS, SMTP, remote-state, Litestream R2, and bootstrap credentials arrive through `COLORS_PAR_*`; GitHub is required only when an operator-owned repository is configured.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu and Ansible files, then runs `create --dry-run` before contacting any provider, server, DNS record, mail domain, or repository.",
    },
    {
      title: "Provision and invite",
      body: "ONCE provisions the server, DNS, mail, and HTTPS. The container uses its temporary loopback admin endpoint to invite the owner, then removes the token and endpoint from steady state.",
    },
    {
      title: "Replicate and recover",
      body: "Litestream continuously copies SQLite to R2, restores automatically when local data is absent, and verifies a separate replica restore with SQLite integrity checking every week.",
    },
  ],
  dagCaption: "Vaultwarden — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "group", nodes: ["tofu-compute", "tofu-smtp"] },
    { kind: "edge" },
    { kind: "node", label: "tofu-dns" },
    { kind: "edge" },
    { kind: "node", label: "tofu-smtp-post" },
    { kind: "edge" },
    { kind: "group", nodes: ["ansible-local", "ansible-remote"] },
  ] satisfies DagItem[],
  dagSummary:
    "The public-image create/build DAG runs `start` → (`tofu-compute`, `tofu-smtp`) → `tofu-dns` → `tofu-smtp-post` → (`ansible-local`, `ansible-remote`).",
  dagNote:
    "This diagram shows the public-image path, which omits the inherited GitHub stage. Setting `vaultwarden-repo` adds credential publication after `ansible-remote`; delete revokes those credentials first. The external R2 replica remains available for recovery and the committed destroy guard refuses accidents.",
};

export const dbosInstallCmd = "npx skills use getcolors/dbos";

export const dbos = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/dbos/",
  repoUrl: "https://github.com/getcolors/dbos",
  heading: "DBOS: durable TypeScript workflows on one production server",
  lede: "DBOS is a Package Skill built with Colors. It provisions a production-oriented DigitalOcean server, embeds the pinned DBOS TypeScript SDK in a reference HTTP API, keeps PostgreSQL private, publishes Cloudflare HTTPS, and writes PostgreSQL backups to Cloudflare R2.",
  runtimeNote:
    "DBOS ships in **green**. Its reference workflow durably sleeps, intentionally retries an activity, safely deduplicates caller-supplied workflow IDs, and resumes after the entire Droplet restarts.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins DBOS and the application image, Amsterdam region, Droplet size, apex hostname, retry policy, retention, PostgreSQL, and backup settings.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean, Cloudflare, R2, PostgreSQL, and backup credentials arrive only through `COLORS_PAR_*`; `COLORS_PAR_PROFILE` is explicitly rejected.",
    },
    {
      title: "Dry-run boundary",
      body: "Build renders deterministic OpenTofu and Ansible files, and `create --dry-run` walks the graph without contacting providers or requiring credentials.",
    },
    {
      title: "Provision and deploy",
      body: "OpenTofu discovers the configured region's default VPC instead of creating one, then provisions the guarded Droplet and DNS before ONCE deploys private PostgreSQL and the DBOS API behind HTTPS.",
    },
    {
      title: "Prove recovery",
      body: "Acceptance checks HTTPS, completion, activity retry, duplicate IDs, deterministic results, R2 backup upload, and recovery after rebooting the Droplet during a durable delay.",
    },
  ],
  dagCaption: "DBOS — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "tofu-compute" },
    { kind: "edge" },
    { kind: "node", label: "tofu-dns" },
    { kind: "edge" },
    { kind: "group", nodes: ["ansible-local", "ansible-remote"] },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `tofu-compute` → `tofu-dns` → (`ansible-local`, `ansible-remote`).",
  dagNote:
    "Delete removes the managed host configuration and DNS before destroying compute, while preserving the pre-existing default VPC, SSH key, R2 state bucket, and backup objects. The committed prevent-destroy guard requires a separately authorized one-run override.",
};

// Walter's own install line. Deliberately not the `installCmd` constant: that
// one is the page's primary call to action and is baked into the og:image by
// scripts/generate-og-image.py, which no build step can reach. Once stays the
// headline skill; this command appears only inside Walter's own section.
export const walterInstallCmd = "npx skills use getcolors/walter";

export const walter = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/walter/",
  repoUrl: "https://github.com/getcolors/walter",
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

export const postgresAgyInstallCmd =
  "npx skills add https://github.com/getcolors/postgres-agy --skill package-postgres-agy-green";

export const postgresAgy = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/postgres-agy/",
  repoUrl: "https://github.com/getcolors/postgres-agy",
  heading: "PostgreSQL HA: 3-node Patroni & etcd failover cluster",
  lede: "PostgreSQL HA is a Package Skill built with Colors. It provisions a 3-node PostgreSQL 17 cluster on DigitalOcean, establishes etcd v3 quorum consensus with Patroni leader election, routes clients via local HAProxy, and streams continuous WAL backups to Cloudflare R2.",
  runtimeNote:
    "PostgreSQL HA ships in **green** (Babashka / Clojure). It orchestrates Patroni, etcd, HAProxy, and pgBackRest with zero human intervention during failover.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins PostgreSQL 17, Patroni 4.1.5, etcd v3.5, 3 Droplets in AMS3, Cloudflare DNS, and pgBackRest R2 bucket.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean API tokens, Cloudflare DNS tokens, and Cloudflare R2 S3 credentials arrive through `COLORS_PAR_*` environment variables.",
    },
    {
      title: "Dry-run boundary",
      body: "Build renders deterministic OpenTofu and Ansible templates locally; `create --dry-run` walks the execution DAG without contacting live providers.",
    },
    {
      title: "Provision & cluster",
      body: "OpenTofu provisions 3 Droplets on the private VPC; Ansible converges etcd v3 quorum, initializes Patroni, configures synchronous replication, and starts HAProxy.",
    },
    {
      title: "Stream & verify PITR",
      body: "pgBackRest streams WAL archives continuously to Cloudflare R2. Automated restore check systemd timers verify standbys can reconstruct state from R2 without data loss.",
    },
  ],
  dagCaption: "PostgreSQL HA — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "tofu-compute" },
    { kind: "edge" },
    { kind: "node", label: "tofu-dns" },
    { kind: "edge" },
    { kind: "group", nodes: ["ansible-local", "cluster", "ansible-remote"] },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `tofu-compute` → `tofu-dns` → (`ansible-local`, `cluster`, `ansible-remote`).",
  dagNote:
    "Delete reverses the DAG, removing HAProxy DNS routing before tearing down etcd consensus and destroying Droplets. Guarded by committed `compute-prevent-destroy: true`.",
};

export const mysqlAgyInstallCmd =
  "npx skills add https://github.com/getcolors/mysql-agy --skill package-mysql-agy-green";

export const mysqlAgy = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/mysql-agy/",
  repoUrl: "https://github.com/getcolors/mysql-agy",
  heading: "MySQL HA: 3-node Group Replication & Floating VIP cluster",
  lede: "MySQL HA is a Package Skill built with Colors. It provisions a 3-node MySQL 8.4 Group Replication cluster on DigitalOcean, manages dynamic primary election via an automated Floating VIP daemon, and streams continuous 1-minute binary logs to Cloudflare R2.",
  runtimeNote:
    "MySQL HA ships in **green** (Babashka / Clojure). Consensus is maintained natively via MySQL Group Communication System (Paxos) without external key-value stores.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It pins MySQL 8.4, Group Replication Single-Primary mode, Reserved IP, Cloudflare DNS, and R2 backup settings.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean API tokens, replication credentials, and Cloudflare R2 keys arrive strictly through `COLORS_PAR_*` environment variables.",
    },
    {
      title: "Dry-run boundary",
      body: "Renders all OpenTofu and Ansible files locally; `create --dry-run` verifies execution DAG and cloud plans without making changes.",
    },
    {
      title: "Provision & form group",
      body: "OpenTofu allocates 3 Droplets and 1 Floating Reserved IP; Ansible joins the 3 members into a Paxos consensus group and starts the VIP claim daemon.",
    },
    {
      title: "Continuous PITR & drill",
      body: "Systemd services spool binary logs every 60s to Cloudflare R2 with daily compressed dumps and automated scratch restore drills verifying zero transaction lag.",
    },
  ],
  dagCaption: "MySQL HA — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "tofu-compute" },
    { kind: "edge" },
    { kind: "node", label: "tofu-dns" },
    { kind: "edge" },
    { kind: "group", nodes: ["ansible-local", "ansible-remote"] },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `tofu-compute` → `tofu-dns` → (`ansible-local`, `ansible-remote`).",
  dagNote:
    "Delete releases the Floating Reserved IP and DNS records before destroying compute, guarded by `compute-prevent-destroy: true`.",
};

export const postgresHaInstallCmd =
  "npx skills add https://github.com/getcolors/postgres-ha --skill package-postgres-ha-green";

export const postgresHa = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/postgres-ha/",
  repoUrl: "https://github.com/getcolors/postgres-ha",
  heading: "PostgreSQL HA (Opus 5): Patroni, colocated etcd, HAProxy on every node",
  lede: "A second, independent implementation of a 3-node PostgreSQL 17 failover cluster, built by Claude Opus 5 in an isolated benchmark run. Patroni 4.1.5 drives a colocated 3-member etcd; HAProxy runs on all three nodes behind three A records, so a failover writes no DNS and calls no cloud API.",
  runtimeNote:
    "PostgreSQL HA (Opus 5) ships in **green** (Babashka / Clojure) and depends only on the Colors SDK — it writes its own DigitalOcean and Cloudflare templates rather than reusing Once.",
  steps: [
    {
      title: "Read desired state",
      body: "The agent reads `colors.yml`: PostgreSQL 17, Patroni 4.1.5, etcd 3.5.33 pinned by tarball SHA-256, three Droplets in AMS3, and a pgBackRest repository in Cloudflare R2.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean, Cloudflare and R2 credentials arrive as `COLORS_PAR_*` environment variables. Only two database credentials exist, and the package is built not to need a third.",
    },
    {
      title: "Dry-run boundary",
      body: "`build` renders OpenTofu and Ansible deterministically with no provider contact; `create --dry-run` walks the whole DAG without side effects.",
    },
    {
      title: "Provision & cluster",
      body: "OpenTofu creates three Droplets on the region's default VPC; Ansible forms etcd quorum, bootstraps Patroni with quorum synchronous commit `ANY 1`, and starts an HAProxy on every node.",
    },
    {
      title: "Archive & prove restore",
      body: "pgBackRest streams WAL to R2 with `archive_command` held in Patroni's DCS, so a promoted node keeps archiving. A daily timer restores the newest backup, replays every segment, and fails unless a leader-written heartbeat is under 900s old.",
    },
  ],
  dagCaption: "PostgreSQL HA (Opus 5) — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "group", nodes: ["ansible-local", "cluster", "acceptance"] },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → (`ansible-local`, `cluster`, `acceptance`).",
  dagNote:
    "Delete reverses the DAG, tearing down the cluster and DNS before destroying compute. Guarded by committed `compute-prevent-destroy: true`.",
};

export const mysqlHaInstallCmd =
  "npx skills add https://github.com/getcolors/mysql-ha --skill package-mysql-ha-green";

export const mysqlHa = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/mysql-ha/",
  repoUrl: "https://github.com/getcolors/mysql-ha",
  heading: "MySQL HA (Opus 5): Group Replication with a reserved-IP endpoint",
  lede: "A second, independent implementation of a 3-node MySQL 8.0 failover cluster, built by Claude Opus 5 in an isolated benchmark run. The three mysqld processes are the Paxos group, so quorum needs no external store, and a DigitalOcean reserved IP follows whichever member reports PRIMARY.",
  runtimeNote:
    "MySQL HA (Opus 5) ships in **green** (Babashka / Clojure) and depends only on the Colors SDK — it writes its own DigitalOcean and Cloudflare templates rather than reusing Once.",
  steps: [
    {
      title: "Read desired state",
      body: "The agent reads `colors.yml`: MySQL 8.0, a fixed group UUID, three Droplets in AMS3, Cloudflare DNS, and an R2 bucket for dumps and binary logs.",
    },
    {
      title: "Resolve secrets",
      body: "DigitalOcean, Cloudflare and R2 credentials arrive as `COLORS_PAR_*` environment variables. MySQL caps replication passwords at 32 characters, so the replication account derives its own deterministically rather than requiring a third secret.",
    },
    {
      title: "Dry-run boundary",
      body: "`build` renders OpenTofu and Ansible deterministically with no provider contact; `create --dry-run` walks the whole DAG without side effects.",
    },
    {
      title: "Provision & cluster",
      body: "OpenTofu creates three Droplets and a reserved IP; Ansible bootstraps Group Replication in single-primary mode, with the group port never leaving the VPC.",
    },
    {
      title: "Archive & prove restore",
      body: "Every ONLINE member spools binary logs to R2 each minute, so any one member is a complete source and the archiver needs no leader election. A daily scratch `mysqld` replays them and asserts it recovered past the snapshot.",
    },
  ],
  dagCaption: "MySQL HA (Opus 5) — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "group", nodes: ["base", "cluster", "backup", "health"] },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → (`base`, `cluster`, `backup`, `health`).",
  dagNote:
    "Delete releases the reserved IP and DNS records before destroying compute, guarded by committed `compute-prevent-destroy: true`.",
};

export const cta = {
  heading: "Give your agent a new skill to create a personal PaaS.",
  lede: "Dry-run first. Approve. Then provision — with Once, built with Colors. Paste this into your coding agent.",
};

export const wavehouseInstallCmd = "npx skills use getcolors/wavehouse";

export const wavehouse = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/wavehouse/",
  repoUrl: "https://github.com/getcolors/wavehouse",
  heading: "WaveHouse: live GitHub analytics on one server, built with Colors",
  lede: "WaveHouse is a Package Skill built with Colors. It provisions a public analytics demo on Vultr — ClickHouse, the WaveHouse real-time gateway, and the project's live GitHub stats dashboard — behind Caddy TLS and Cloudflare, with history backfilled from the GitHub API and a poller streaming new events over SSE.",
  runtimeNote:
    "WaveHouse ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. The dashboard is the upstream project's own page served same-origin with the `/v1` API, so the browser SDK needs no configuration; see it live at [stats.bigconfig.space](https://stats.bigconfig.space).",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the dashboard host, the tracked `owner/name` repository, poll interval, container images, and the Vultr and state-backend boundary.",
    },
    {
      title: "Resolve secrets",
      body: "Vultr, Cloudflare, remote-state, and a read-only GitHub token arrive through `COLORS_PAR_*`; the gateway's operator key is generated on the server and never leaves it.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose, Caddy, schema, and pipe files, then runs `create --dry-run` before contacting providers or the server.",
    },
    {
      title: "Provision and backfill",
      body: "OpenTofu creates the instance, firewall, and proxied DNS record; Ansible converges the stack, registers 19 public pipes, backfills GitHub history, and starts the 60-second poller.",
    },
    {
      title: "Prove it is live",
      body: "Acceptance checks public HTTPS gateway health, the served dashboard assets, and that `gh_summary` reports backfilled events before create is called done.",
    },
  ],
  dagCaption: "WaveHouse — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → `ansible` → `acceptance`.",
  dagNote:
    "Only Caddy 80/443 and key-only SSH are public; ingest and admin need the server-held operator key while browsers stay anonymous and read-only. Delete reverses Ansible, DNS, and infrastructure while the committed destroy guard refuses accidents.",
};

export const githubDwhInstallCmd = "npx skills use getcolors/github-dwh";

export const githubDwh = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/github-dwh/",
  repoUrl: "https://github.com/getcolors/github-dwh",
  heading: "GitHub DWH: your organization's GitHub warehouse on one server",
  lede: "GitHub DWH is a Blue Package Skill built with Colors. It provisions a single-host warehouse for everything a GitHub organization credential can see — dlt extracts to ClickHouse, dbt builds tested marts, Lightdash serves the dashboards, and a PocketBase control plane schedules and records whole workflow runs behind Caddy TLS on Vultr.",
  runtimeNote:
    "GitHub DWH ships in **blue** alone. PocketBase stores schedules and whole-run history only; Blue owns workflow routing, systemd owns process supervision, and journald owns full logs.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the GitHub organization and resources, the control-plane and analytics hosts, ClickHouse databases, the Lightdash R2 bucket, the dispatch calendar, and the Vultr and state-backend boundary.",
    },
    {
      title: "Resolve secrets",
      body: "Vultr, Cloudflare, remote-state, GitHub, ClickHouse, and Lightdash credentials arrive through `COLORS_PAR_*`; the package refuses a `COLORS_PAR_PROFILE` overlay because profile keys the shared remote state.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose, and dbt files, then runs `create --dry-run` before contacting providers or the server.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the instance, firewall, and DNS records with state in R2; Ansible converges ClickHouse, PocketBase, Lightdash, Caddy, and the systemd dispatcher, then converges the Lightdash organization, project, and dashboard.",
    },
    {
      title: "Run the warehouse",
      body: "Each scheduled or manual PocketBase run is one `./blue run`: dlt extracts, dbt builds and tests the marts, and Lightdash resynchronizes — with full logs in journald.",
    },
  ],
  dagCaption: "GitHub DWH — RUN DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "dlt" },
    { kind: "edge" },
    { kind: "node", label: "dbt-run" },
    { kind: "edge" },
    { kind: "node", label: "dbt-test" },
    { kind: "edge" },
    { kind: "node", label: "lightdash" },
  ] satisfies DagItem[],
  dagSummary:
    "The run DAG executes `start` → `dlt` → `dbt-run` → `dbt-test` → `lightdash`.",
  dagNote:
    "Create converges infrastructure and services as its own DAG (`start` → `tofu` → `ansible`); a failed load is retried only as a new complete run. Delete reverses Ansible and infrastructure while the committed destroy guard refuses accidents.",
};

export const clickstackInstallCmd = "npx skills use getcolors/clickstack";

export const clickstack = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/clickstack/",
  repoUrl: "https://github.com/getcolors/clickstack",
  heading: "ClickStack: an open-source observability stack on one server, built with Colors",
  lede: "ClickStack is a Package Skill built with Colors. It provisions the HyperDX observability stack on a single Vultr instance — ClickHouse for telemetry, MongoDB for application state, the HyperDX OpenTelemetry collector, and the HyperDX UI — behind Caddy TLS and Cloudflare, with logs, traces, and metrics ingested over OTLP on the same host that serves the dashboard.",
  runtimeNote:
    "ClickStack ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. One hostname carries both halves: the UI and OTLP/HTTP ingestion share port 443, so an exporter needs no endpoint beyond `https://<host>` and 4317/4318 are never exposed.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the public host, the initial team's admin email, the five container images, and the Vultr and state-backend boundary. It carries no key material and no secret.",
    },
    {
      title: "Own the machine keypair",
      body: "With no `vultr-ssh-keys` in desired state the package generates `~/.ssh/<profile>`, registers it as the Vultr account key named for the profile, and removes it last on delete — the workspace SSH keypair standard, not a bespoke rule.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose, and Caddy files, then runs `create --dry-run` before contacting providers or the server. Build and dry-run need no credentials and never read `~/.ssh`.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the instance, a firewall open only on 22/80/443, and a proxied Cloudflare record; Ansible converges the Compose stack and creates the initial HyperDX team — until one exists the collector binds no OTLP receivers at all.",
    },
    {
      title: "Prove it ingests",
      body: "Acceptance sends one OTLP log over public HTTPS and reads the row back out of ClickHouse, so create is called done only when telemetry actually lands.",
    },
  ],
  dagCaption: "ClickStack — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `dns` → `ansible` → `acceptance`.",
  dagNote:
    "The ingestion key is the team's own `apiKey`, minted by the application and therefore unknowable in advance; convergence reads it back rather than inventing one. Delete reverses Ansible, DNS, and infrastructure and drops the keypair only after the compute destroy succeeded, while the committed destroy guard refuses accidents.",
};

export const signozInstallCmd = "npx skills use getcolors/signoz";

export const signoz = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/signoz/",
  repoUrl: "https://github.com/getcolors/signoz",
  heading: "SigNoz: a self-hosted OpenTelemetry backend on one server, built with Colors",
  lede: "SigNoz is a Package Skill built with Colors. It provisions the SigNoz observability stack on a single Vultr instance \u2014 ClickHouse and ClickHouse Keeper for telemetry, a Postgres metastore for dashboards and alert rules, the schema migrator, the SigNoz application, and the signoz-otel-collector ingester \u2014 behind Caddy TLS and Cloudflare, with traces, logs, and metrics arriving over OTLP on the same host that serves the UI.",
  runtimeNote:
    "SigNoz ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. One hostname carries both halves: the UI and OTLP/HTTP ingestion share port 443, so an exporter needs no endpoint beyond `https://<host>` and 4317/4318 never leave loopback.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the public host, the root account, the six container images, the nightly metastore backup, and the Vultr and state-backend boundary. It carries no key material and no secret.",
    },
    {
      title: "Own the machine keypair",
      body: "With no `vultr-ssh-keys` in desired state the package generates `~/.ssh/<profile>`, registers it as the Vultr account key named for the profile, writes the matching `~/.ssh/config` block so `ssh <profile>` works, and removes the key last on delete \u2014 the workspace SSH keypair and config standards, not bespoke rules.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose, and Caddy files, then runs `create --dry-run` before contacting providers or the server. Build and dry-run need no credentials and never read `~/.ssh`.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the instance, a firewall open only on 22/80/443, and a proxied Cloudflare record before Caddy asks Let's Encrypt for a certificate; Ansible then converges the Compose stack and mints the OTLP bearer token on the server, because SigNoz community edition has no ingestion keys of its own.",
    },
    {
      title: "Prove it is closed",
      body: "The end-to-end ingest proof runs on the server where the token lives. From outside, acceptance requires the UI over HTTPS, a healthy API, and an unauthenticated OTLP write that comes back **401** \u2014 an endpoint that accepted it would be an open write path into ClickHouse.",
    },
  ],
  dagCaption: "SigNoz \u2014 CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "ssh-config" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` \u2192 `infrastructure` \u2192 `ssh-config` \u2192 `dns` \u2192 `ansible` \u2192 `acceptance`.",
  dagNote:
    "Delete is not the create order reversed twice over: the `~/.ssh/config` block goes before the compute destroy, while the keypair goes after it \u2014 a stale block is harmless, a key removed early locks you out of a machine that still exists. The committed destroy guard refuses accidents either way.",
};

export const netbirdInstallCmd = "npx skills use getcolors/netbird";

export const netbird = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/netbird/",
  repoUrl: "https://github.com/getcolors/netbird",
  heading: "NetBird: a self-hosted zero-trust network and its identity provider, built with Colors",
  lede: "NetBird is a Package Skill built with Colors. It provisions a self-hosted NetBird control plane on a single Vultr instance — Traefik, the combined `netbird-server` carrying management, signal, relay and STUN, the dashboard, and Authentik with its Postgres and Redis — behind Cloudflare and Let's Encrypt, with SSO through Authentik and encrypted nightly backups to R2.",
  runtimeNote:
    "NetBird ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. Management, signal, relay and STUN are one process multiplexed behind Traefik on 443, so the firewall opens 22, 80, 443 and a single UDP port — and nothing else.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the two public hosts, the local break-glass owner, Authentik's first administrator, the seven container images, the nightly encrypted backup, and the Vultr and state-backend boundary. It carries no key material and no secret.",
    },
    {
      title: "Own the machine keypair",
      body: "With no `vultr-ssh-keys` in desired state the package generates `~/.ssh/<profile>`, registers it as the Vultr account key named for the profile, writes the matching `~/.ssh/config` block so `ssh <profile>` works, and removes the key last on delete — the workspace SSH keypair and config standards, not bespoke rules.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose and Traefik files, then runs `create --dry-run` before contacting providers or the server. Build and dry-run need no credentials and never read `~/.ssh`.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the instance, a firewall open only on 22/80/443 and one UDP port, and two **unproxied** Cloudflare records — proxying would break both STUN and the TLS-ALPN-01 challenge. Ansible then converges the Compose stack and generates every remaining secret on the host, where it stays.",
    },
    {
      title: "Sign in without a browser",
      body: "Convergence drives the real OAuth2 flow through Authentik's flow-executor API and creates the federated account itself, so there is no wizard and no GUI step. Acceptance enrols two throwaway peers on isolated networks, proves traffic flows over the relay, validates both certificates through the system trust store, and reads the served dashboard JavaScript to prove it was configured rather than merely answering 200.",
    },
  ],
  dagCaption: "NetBird — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "ssh-config" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `ssh-config` → `dns` → `ansible` → `acceptance`.",
  dagNote:
    "DNS sits before convergence because Traefik asks Let's Encrypt for a certificate the moment it starts and TLS-ALPN-01 only succeeds once the names resolve. Delete reverses that, except twice: the `~/.ssh/config` block goes before the compute destroy while the keypair goes after it, and a final encrypted backup is taken before anything is torn down. The committed destroy guard refuses accidents either way.",
};

export const agentNetworkInstallCmd = "npx skills use getcolors/agent-network";

export const agentNetwork = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/agent-network/",
  repoUrl: "https://github.com/getcolors/agent-network",
  heading: "Agent Network: keyless LLM access an isolated agent cannot escape, built with Colors",
  lede: "Agent Network is a Package Skill built with Colors. It provisions a minimal NetBird Agent Network demo on a single Vultr instance — Traefik, the combined `netbird-server`, the dashboard in agent-network view, the private reverse proxy — and an agent container running headless Claude Code on an internal Docker network with no internet route. The agent holds no API key: its only path to an LLM is the generated tunnel-only endpoint, where every request carries its peer identity, passes a model allowlist and per-day budget caps, and lands attributed in the access log.",
  runtimeNote:
    "Agent Network ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. The isolation is the demo: an internal Docker network doubled by port-scoped DOCKER-USER rules, with acceptance proving the negative space — raw-TCP probes that must fail beside a control probe that must succeed — after a real Docker restart and a real reboot.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the public host and its wildcard, the claimed models with their prices, the guardrail allowlist, the per-day policy caps and the account-wide ceiling, the two Docker subnets, and every image by tag and digest. It carries no key material and no secret.",
    },
    {
      title: "Own the machine keypair",
      body: "With no `vultr-ssh-keys` in desired state the package generates `~/.ssh/<profile>`, registers it as the Vultr account key named for the profile, writes the matching `~/.ssh/config` block so `ssh <profile>` works, and removes the key last on delete — the workspace SSH keypair and config standards, not bespoke rules.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose and Traefik files, then runs `create --dry-run` before contacting providers or the server. Build and dry-run need no credentials and never read `~/.ssh`.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the instance, a firewall open only on 22/80/443 and one UDP port, and two **unproxied** Cloudflare records — the name and its wildcard, because the endpoint label is minted at bootstrap and nothing knows it earlier. Ansible converges the stack, issues the wildcard certificate over DNS-01, and reconciles the control plane headlessly: admin account, endpoint, provider, guardrail, policy, global limit, and the agent's single-use setup key on tmpfs.",
    },
    {
      title: "Prove the claim",
      body: "Acceptance is the demo: the agent cannot reach the internet but its keyless call traverses the tunnel; a claimed-but-disallowed model is denied by the guardrail and an unclaimed one by routing, both at zero upstream cost; headless Claude Code rides the same governed path; every access-log entry carries the enrolled peer id; and an outside caller gets exactly the pre-identity 403. A deliberately fake provider key is a supported mode — the relayed upstream 401 proves the whole path with nothing billable.",
    },
  ],
  dagCaption: "Agent Network — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "ssh-config" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `ssh-config` → `dns` → `ansible` → `acceptance`.",
  dagNote:
    "DNS sits before convergence because both certificate paths need resolvable names — Traefik's TLS-ALPN-01 for the base host and lego's DNS-01 for the wildcard the endpoint lives under. Delete reverses that with the standard split: the `~/.ssh/config` block goes before the compute destroy while the keypair goes after it. No backups, deliberately — the deployment is disposable, and a later create regenerates the endpoint hostname and every peer identity.",
};

export const agentNetworkK8sInstallCmd = "npx skills use getcolors/agent-network-k8s";

export const agentNetworkK8s = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/agent-network-k8s/",
  repoUrl: "https://github.com/getcolors/agent-network-k8s",
  heading: "Agent Network K8s: the keyless, isolated agent — unprivileged, on managed Kubernetes",
  lede: "Agent Network K8s is a Package Skill built with Colors. It provisions the NetBird Agent Network demo on a Vultr Kubernetes Engine cluster — Traefik behind a TCP load balancer, the combined `netbird-server` on a CSI volume, the dashboard in agent-network view, the private reverse proxy — and a two-pod application: the NetBird client in netstack/SOCKS5 mode (userspace WireGuard — no TUN device, no capabilities) and an agent pod running headless Claude Code whose only network egress, enforced by a default-deny NetworkPolicy, is that SOCKS5 listener. The agent holds no API key, no ServiceAccount token, and no DNS: its one road to an LLM is the tunnel-only endpoint, where every request carries its peer identity, passes a model allowlist and per-day budget caps, and lands attributed in the access log.",
  runtimeNote:
    "Agent Network K8s ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity by its own three-colour harness. The isolation claim is probed from **both sides** of the SOCKS5 listener — raw-TCP probes around it and CONNECT probes through it, each paired with a control that must succeed — under `restricted` Pod Security, and re-proven by a five-disruption suite that ends with a node drain.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the public host and its wildcard, the claimed models with their prices, the guardrail allowlist, the per-day policy caps and the account-wide ceiling, the VKE version and node pool, and every image by tag and digest — the NetBird release train, the kaniko builder, and the agent image's pinned inputs. It carries no key material and no secret.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Kubernetes manifests, the NetworkPolicy matrix, and every converge script, then runs `create --dry-run` before contacting providers or the cluster. Build and dry-run need no credentials; the pinned VKE version is checked against the live supported list while failing is still free.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the VKE cluster and a deployment-owned container registry; kubectl converges the gateway with create-once cluster secrets and a proxy token minted in-cluster; kaniko builds the agent image from a streamed, content-addressed context, and the deploy consumes only the digest read back from the registry. DNS goes to the load balancer, and one lego DNS-01 order carries both SANs — the base name and its wildcard.",
    },
    {
      title: "Enroll the two-pod application",
      body: "The control plane is reconciled headlessly — admin account, endpoint, provider, guardrail, policy, global limit — and the client enrolls with a single-use setup key streamed over `exec` stdin into memory-backed storage, never a Kubernetes Secret. The reverse proxy is an embedded peer invisible to the peers API, so its overlay address is read from the enrolled client's own network map and reconciled whenever a restart mints a new one.",
    },
    {
      title: "Prove the claim",
      body: "Acceptance probes the negative space from both sides of the listener: the agent reaches nothing directly, and CONNECTs through the SOCKS5 pod reach only the proxy's overlay address — public names, the metadata endpoint, and the API server all refuse. Both denial classes land at zero upstream cost, an outside caller gets exactly the pre-identity 403, limits read back as desired state says, and the whole claim is re-proven after pod deletes, gateway restarts, and a node drain. A deliberately fake provider key is a supported mode — the relayed upstream 401 proves the path with nothing billable.",
    },
  ],
  dagCaption: "Agent Network K8s — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "deploy" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "certificate" },
    { kind: "edge" },
    { kind: "node", label: "bootstrap" },
    { kind: "edge" },
    { kind: "node", label: "agent" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `deploy` → `dns` → `certificate` → `bootstrap` → `agent` → `acceptance`.",
  dagNote:
    "Deploy applies the edge and the proxy but deliberately does not await them — both mount the TLS Secret the certificate stage issues after DNS points at the load balancer — and their readiness is claimed only once it exists. Delete tears down in-cluster first (workloads, CSI volumes, the load balancer, each confirmed absent at the provider) because those are Kubernetes-managed and invisible to the infrastructure state. No backups, deliberately — the deployment is disposable, and a later create regenerates the endpoint hostname and every peer identity.",
};

export const agentNetworkDoksInstallCmd = "npx skills use getcolors/agent-network-doks";

export const agentNetworkDoks = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/agent-network-doks/",
  repoUrl: "https://github.com/getcolors/agent-network-doks",
  heading: "Agent Network DOKS: the keyless, isolated agent on DigitalOcean Kubernetes",
  lede: "Agent Network DOKS is a Package Skill built with Colors. It provisions the NetBird Agent Network demo on a DigitalOcean Kubernetes cluster — Traefik behind a TCP-mode regional Load Balancer, the combined `netbird-server` on a CSI volume, the dashboard in agent-network view, the private reverse proxy — and the two-pod application: the NetBird client in netstack/SOCKS5 mode (userspace WireGuard — no TUN device, no capabilities) and an agent pod running headless Claude Code whose only network egress, enforced by a default-deny NetworkPolicy, is that SOCKS5 listener. The agent holds no API key, no ServiceAccount token, and no DNS: its one road to an LLM is the tunnel-only endpoint, where every request carries its peer identity, passes a model allowlist and per-day budget caps, and lands attributed in the access log.",
  runtimeNote:
    "Agent Network DOKS ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity by its own three-colour harness across both state backends. The isolation claim is probed from **both sides** of the SOCKS5 listener under `restricted` Pod Security, and a Cilium canary proves NetworkPolicy enforcement on the actual cluster before any secret enters it.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the public host and its wildcard, the claimed models with their prices, the guardrail allowlist, the per-day policy caps and the account-wide ceiling, the DOKS version slug and node pool, and every image by tag and digest. The cluster subnets appear nowhere — they are outputs, read back from the API. It carries no key material and no secret.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Kubernetes manifests, the NetworkPolicy matrix, and every converge script, then runs `create --dry-run` before contacting providers or the cluster. Build and dry-run need no credentials; the pinned DOKS version slug is checked against the live supported list while failing is still free.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the DOKS cluster and the container registry — created and profile-named, or adopted by name behind a tier-aware capacity preflight — with asymmetric rotated credentials: the write credential exists only while kaniko builds, and the read-only pull credential is re-applied each converge. kubectl converges the gateway, kaniko builds the agent image in-cluster from a streamed, content-addressed context, and the deploy consumes only the digest read back from the registry. DNS goes to the load balancer, and one lego DNS-01 order carries both SANs — the base name and its wildcard.",
    },
    {
      title: "Enroll the two-pod application",
      body: "The control plane is reconciled headlessly — admin account, endpoint, provider, guardrail, policy, global limit — and the client enrolls with a single-use setup key streamed over `exec` stdin into memory-backed storage, never a Kubernetes Secret. The reverse proxy is an embedded peer invisible to the peers API, so its overlay address is read from the enrolled client's own network map and reconciled whenever a restart mints a new one.",
    },
    {
      title: "Prove the claim",
      body: "Acceptance probes the negative space from both sides of the listener: the agent reaches nothing directly, and CONNECTs through the SOCKS5 pod reach only the proxy's overlay address. The load-balancer firewall is verified through the DigitalOcean API — an open deployment cannot prove denial by probing. Both denial classes land at zero upstream cost, an outside caller gets exactly the pre-identity 403, and the whole claim is re-proven after pod deletes, gateway restarts, and a node drain. A deliberately fake provider key is a supported mode — the relayed upstream 401 proves the path with nothing billable.",
    },
  ],
  dagCaption: "Agent Network DOKS — CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "deploy" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "certificate" },
    { kind: "edge" },
    { kind: "node", label: "bootstrap" },
    { kind: "edge" },
    { kind: "node", label: "agent" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` → `infrastructure` → `deploy` → `dns` → `certificate` → `bootstrap` → `agent` → `acceptance`.",
  dagNote:
    "Deploy applies the edge and the proxy but deliberately does not await them — both mount the TLS Secret the certificate stage issues after DNS points at the load balancer — and their readiness is claimed only once it exists. Delete tears down in-cluster first (workloads, CSI volumes, the load balancer, each confirmed absent at the provider) because those are Kubernetes-managed and invisible to the infrastructure state; an adopted registry survives, with exactly the deployment's own repository deleted. No backups, deliberately — the deployment is disposable, and a later create regenerates the endpoint hostname and every peer identity.",
};

export const n8nInstallCmd = "npx skills use getcolors/n8n";

export const n8n = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/n8n/",
  repoUrl: "https://github.com/getcolors/n8n",
  heading: "n8n: workflow automation whose database is object storage, built with Colors",
  lede: "n8n is a Package Skill built with Colors. It provisions n8n 2.36.9 on a single Vultr instance \u2014 the n8n server, an external task runner isolating Code nodes, and Caddy terminating TLS \u2014 backed not by a colocated Postgres but by a colocated self-hosted Neon, so the durable copy of every workflow, credential and execution lives in Cloudflare R2 rather than on the instance's disk. Seven containers, one Compose project, and only the proxy publishes beyond loopback.",
  runtimeNote:
    "n8n ships in **green, red and blue**, rendering byte-identical output. The storage tier is not reimplemented in any of them: this package SHA-pins `getcolors/neon` and renders that package's templates straight out of the dependency \u2014 off the classpath in green, out of the installed package in red and blue \u2014 so **no copy of the storage tier exists here to drift** \u2014 n8n's services arrive as a Compose override installed beside the upstream file, which is what lets every unchanged upstream command operate on the one merged project.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It carries the digest-pinned n8n, runner, Caddy and Neon images, the 32-hex tenant and timeline identities, the public hostname, retention and concurrency bounds, and declared soak thresholds. It holds no key material \u2014 and it speaks the storage tier's key vocabulary, because those templates are rendered from a pin rather than copied.",
    },
    {
      title: "Refuse what fails later",
      body: "Validation reports every problem at once and encodes traps as rules: a runner image whose version differs from the n8n image, the deprecated `WEBHOOK_URL` spelling, binary data left in memory, an unbounded concurrency limit, and Cloudflare-only ingress without a proxied record \u2014 which would otherwise pass the converge and fail hours later with no certificate.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose and Caddy files, then walks the DAG with every side effect skipped. Build and dry-run need no credentials, and an offline `--syntax-check` over the rendered playbooks catches the whole class of failures that only appear at Ansible load time.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the instance, a DNS record, and a firewall whose HTTP rules resolve to Cloudflare's published ranges; Ansible converges the storage tier through the imported upstream play, then n8n's own \u2014 and claims the owner account over the internal network **before** the public name resolves, closing the window in which an unauthenticated setup screen hands the instance to whoever finds it first.",
    },
    {
      title: "Prove it works",
      body: "Seventeen gates ask the system what it has: a workflow created through the public API and read back **out of Neon**, a new WAL segment in R2 beyond a pre-switch baseline, liveness and readiness separately, the generated webhook URL exactly, and a Code node that actually **executes** on the external runner \u2014 because a runner reports connected long before it has run a task.",
    },
  ],
  dagCaption: "n8n \u2014 CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ssh-config" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` \u2192 `infrastructure` \u2192 `dns` \u2192 `ssh-config` \u2192 `ansible` \u2192 `acceptance`.",
  dagNote:
    "`dns` comes before the converge, not after: Caddy provisions its certificate over ACME on first start, and the HTTP-01 challenge needs the name to already resolve. Delete reverses it \u2014 the record goes before the compute destroy, so nothing resolves to an address that has stopped answering.",
};

export const neonInstallCmd = "npx skills use getcolors/neon";

export const neon = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/neon/",
  repoUrl: "https://github.com/getcolors/neon",
  heading: "Neon: self-hosted serverless Postgres with its storage in R2, built with Colors",
  lede: "Neon is a Package Skill built with Colors. It provisions self-hosted Neon \u2014 Postgres with storage and compute separated \u2014 on a single Vultr instance: the storage broker, the pageserver, one safekeeper, and a Postgres 17 compute node under compute_ctl, with pageserver layers and safekeeper WAL uploaded to Cloudflare R2 under the deployment's own prefix. The R2 prefix plus the tenant and timeline ids in colors.yml are the database: a rebuilt host re-attaches the same identities and rehydrates from R2.",
  runtimeNote:
    "Neon ships in all three colours \u2014 **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. Nothing is published beyond loopback: the firewall opens **22 only**, and the supported client path is an SSH tunnel through the `~/.ssh/config` alias the package writes.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the two digest-pinned images, the Postgres major, the 32-hex tenant and timeline identities, the application database and role, the R2 endpoint and bucket, and the Vultr and state-backend boundary. It carries no key material and no secret.",
    },
    {
      title: "Own the machine keypair",
      body: "With no `vultr-ssh-keys` in desired state the package generates `~/.ssh/<profile>`, registers it as the Vultr account key named for the profile, and writes the matching `~/.ssh/config` block \u2014 the alias the converge, the client tunnel, and the acceptance probe all ride.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Ansible, Compose, and compute-spec files, then runs `create --dry-run` before contacting providers or the server. Build and dry-run need no credentials and never read `~/.ssh`.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the instance and a firewall open only on 22; Ansible converges the storage tier, reconciles the tenant and timeline against R2 behind two-phase ownership markers and a monotonic generation counter, mints SCRAM credentials on the host, and only then starts the compute node \u2014 recreate-only by doctrine.",
    },
    {
      title: "Prove it works",
      body: "Acceptance asks the system what it has: a SQL round-trip, a wrong password refused, a passwordless connection refused, privilege escalation refused, a **new** WAL segment in R2 beyond a pre-switch baseline \u2014 and, from the workstation, the same probe through the SSH tunnel itself.",
    },
  ],
  dagCaption: "Neon \u2014 CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "ssh-config" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` \u2192 `infrastructure` \u2192 `ssh-config` \u2192 `ansible` \u2192 `acceptance`.",
  dagNote:
    "There is no dns stage on purpose: nothing in this package is reachable by name. Delete removes the `~/.ssh/config` block before the compute destroy and the keypair after it \u2014 and leaves the R2 data in place, because that prefix is the database, not a byproduct.",
};

export const automqInstallCmd = "npx skills use getcolors/automq";

export const automq = {
  eyebrow: "Package Skill",
  docsUrl: "https://getcolors.github.io/automq/",
  repoUrl: "https://github.com/getcolors/automq",
  heading: "AutoMQ: a Kafka cluster whose disks are object storage, built with Colors",
  lede: "AutoMQ is a Package Skill built with Colors. It provisions three AutoMQ 1.7.4 nodes on Vultr \u2014 the Apache Kafka 3.9.1 wire protocol, both KRaft roles on every node \u2014 with Cloudflare R2 as the storage tier rather than replicated local disks. A produce is acknowledged once the record is in R2, which is why every topic is replication factor 1 and why losing a broker loses no bytes. The three nodes buy the controller quorum, partition failover and throughput; they do not buy copies.",
  runtimeNote:
    "AutoMQ ships in all three colours — **red**, **green** and **blue** render byte-identical artifacts from one `colors.yml`, held to parity on every commit. The public endpoint on **9092** is `SASL_SSL` with **SCRAM-SHA-512** and a `StandardAuthorizer` ACL set, because a port facing the internet is not gated by a firewall and authentication is not authorization. The controller quorum and inter-broker replication never leave a Vultr VPC.",
  steps: [
    {
      title: "Read desired state",
      body: "Agent reads `colors.yml`. It names the digest-pinned image, the node count, the cluster id that is also the object namespace, the bootstrap and broker hostnames, the two R2 buckets, and the VPC and firewall boundary. It carries no key material and no secret.",
    },
    {
      title: "Adopt storage, never create it",
      body: "AutoMQ writes hash-prefixed keys at the bucket root and supports no path prefix, so a bucket belongs to one cluster outright. Adoption proves emptiness by paginating the whole bucket, claims ownership with a conditional create, and carries one transaction id across both buckets \u2014 so a half-adopted pair resumes and a mismatched one fails.",
    },
    {
      title: "Dry-run boundary",
      body: "Builds deterministic OpenTofu, Cloudflare records, Ansible, Compose and broker configuration, then runs `create --dry-run` before contacting providers. Build and dry-run need no credentials and never read `~/.ssh`.",
    },
    {
      title: "Provision and converge",
      body: "OpenTofu creates the VPC, the firewall and three instances; Ansible opens the host firewall the image ships enabled, issues one certificate from node 0 alone, formats the quorum with identical SCRAM bootstrap records, and starts the brokers.",
    },
    {
      title: "Prove it works",
      body: "Six gates on the hosts and seven from the workstation, including a failover targeted at a partition **because** the killed broker leads it \u2014 a generic round trip over six partitions can pass without ever touching the broker it killed.",
    },
  ],
  dagCaption: "AutoMQ \u2014 CREATE / BUILD DAG",
  dag: [
    { kind: "node", label: "start", dark: true },
    { kind: "edge" },
    { kind: "node", label: "infrastructure" },
    { kind: "edge" },
    { kind: "node", label: "ssh-config" },
    { kind: "edge" },
    { kind: "node", label: "dns" },
    { kind: "edge" },
    { kind: "node", label: "ansible" },
    { kind: "edge" },
    { kind: "node", label: "acceptance" },
  ] satisfies DagItem[],
  dagSummary:
    "The create/build DAG runs `start` \u2192 `infrastructure` \u2192 `ssh-config` \u2192 `dns` \u2192 `ansible` \u2192 `acceptance`.",
  dagNote:
    "DNS comes before convergence because every broker advertises a name that must already resolve, and the certificate is issued for those names during the play. Delete unwinds the other way and stops at the storage: the buckets hold the cluster\u2019s data, so an accidental delete stays recoverable.",
};

export const footer = {
  name: "Colors",
  links: [
    { href: "https://github.com/getcolors", label: "GitHub" },
    { href: "https://discord.gg/3aQzzrrdFj", label: "Discord" },
  ],
};
