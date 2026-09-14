---
marp: true
theme: colors
size: 16:9
paginate: true
header: Colors
footer: Introduction
title: "Colors | Describe the infrastructure. Get the complete workflow."
description: "An introduction to agent-authored Colors workflows, Package Skills, Context Skills, and execution without an agent."
author: Colors
lang: en
---

<!-- _class: lead -->

<span class="badge">An open-source workflow SDK for DevOps</span>

# Describe the infrastructure.<br>Get the complete workflow.

Ask your agent to write the program that brings your infrastructure to its desired state.

Review and test the code, then run it without an agent.

<p class="small"><a href="https://www.getcolors.ai/slides/introduction/introduction.pdf">Download the PDF</a> · <a href="https://www.getcolors.ai">getcolors.ai</a></p>

<!--
Allow about one minute. Start with a familiar task: deploying an application with a database, private networking, backups, and checks that prove the application works. An agent can help create the automation. The useful deliverable is the entire executable workflow, including how the tools work together. Colors supplies an SDK for writing that workflow. Once reviewed and tested, the code can run from a terminal or CI without a model at execution time. This talk follows the path from infrastructure requirements to that reusable program. Explain that convergence means bringing observed infrastructure toward the configuration's desired state. It remains a property the workflow must implement and verify.
-->

---

## Have the agent write the orchestration too

Generated OpenTofu and Ansible files still leave work for you.

<div class="two-col">
<div class="card">
<h3>The tools handle their steps</h3>
<p>OpenTofu provisions resources.</p>
<p>Ansible configures systems.</p>
</div>
<div class="card">
<h3>The workflow connects them</h3>
<p>Pass addresses and inventory between tools.</p>
<p>Order operations, handle failures, and check the result.</p>
</div>
</div>

Ask for the program that coordinates the whole deployment.

<!--
Allow about one minute. Generating infrastructure definitions and playbooks is useful, but someone must still decide when each tool runs and what the next step receives. That coordination often remains in shell history, manual instructions, or an agent session. It deserves the same review and version control as the files themselves. Colors moves the request up one level: describe the infrastructure and ask the agent to write both the tool-specific code and its orchestration. OpenTofu and Ansible are the current package examples. Their responsibilities vary with the package, and Colors does not replace their underlying resource or configuration logic.
-->

---

## Your requirements become executable code

Describe the topology, platform, constraints, and acceptance criteria.

<div class="flow">
<div class="card"><h3>colors.yml</h3><p>The desired state for your infrastructure.</p></div>
<div class="card"><h3>Colors workflow</h3><p>Code that coordinates the CLI tools.</p></div>
<div class="card"><h3>Acceptance checks</h3><p>Evidence that the result meets your requirements.</p></div>
</div>

The agent creates these together. Your team reviews and tests them together.

<!--
Allow about ninety seconds. A useful request names the infrastructure shape, provider, network restrictions, backup expectations, and what success means. The agent uses those requirements to write colors.yml and the workflow that interprets it. The configuration schema belongs to the package; colors.yml is not a universal catalog of every possible resource. Acceptance checks belong in the resulting automation. For example, a process being alive is weaker evidence than writing an observation through the application API and reading it back. Review the sequence, inputs, retries, partial-failure behavior, and verification. Generated code still needs testing. Ask the agent to revise the program when the requirements or evidence change, so the improvement remains available for subsequent runs.
-->

---

## Use the CLI tools your infrastructure needs

Colors provides the workflow structure. CLI tools perform the operations.

| Current Package Skills | Other possible workflows |
| :--- | :--- |
| OpenTofu provisions infrastructure | `kubectl` manages Kubernetes resources |
| Ansible configures and verifies hosts | Helm installs and updates charts |
| Provider CLIs and scripts support the deployment | Other DevOps CLIs fit the same model |

<p class="small">Red uses TypeScript / Bun · Green uses Clojure / Babashka · Blue uses Python / uv</p>

<!--
Allow about one minute. The current Package Skills focus on OpenTofu and Ansible, but those tools do not define the boundary of Colors. A workflow can invoke any DevOps CLI. Kubernetes tools illustrate another possible application of the workflow model; this slide does not claim that a particular Kubernetes Package Skill already ships. The author chooses appropriate tools and implements their ordering and checks. Red, Green, and Blue are the SDK implementations for three programming environments. They offer a choice of language for the same workflow approach. In the Langfuse example, the three implementations share the same configuration and lifecycle verbs, and its parity checks compare rendered outputs.
-->

---

## A Package Skill is a reusable program

It bundles executable Colors workflow code with instructions for using it.

<div class="two-col">
<div class="card">
<h3>Keep the operational decisions</h3>
<p>Tool calls, execution order, templates, and checks live in reviewable files.</p>
</div>
<div class="card">
<h3>Choose who runs the code</h3>
<p>A person, CI runner, or coding agent can execute the package.</p>
</div>
</div>

An agent helps author the package. It is optional when the package runs.

<!--
Allow about one minute. The word Skill can suggest instructions that only make sense inside an agent. A Package Skill includes an executable program. Its instructions help users and agents understand and use that program. The workflow reads desired state from colors.yml, coordinates CLI tools, and checks outcomes. The code survives the session that produced it and can enter the team's normal code review and release process. Reuse is valuable even when every run is triggered by a human or existing CI system. Reproducibility also depends on controlled dependencies, inputs, and external systems. A package does not gain that property merely because its code is committed.
-->

---

## Context Skills carry lessons from verified builds

Give the agent evidence it can use when it writes your workflow.

- Symptoms that identify known failures.
- Working approaches and version-specific constraints.
- References to the code and checks that verified each claim.
- The limits of what the previous build established.

<p class="muted">Use those lessons to tailor the solution. Verify it against your own requirements.</p>

<!--
Allow about ninety seconds. A Context Skill is distilled knowledge from a verified build. It records operational facts that are expensive to rediscover, including failures, fixes, and the versions for which they were observed. It can direct the agent to maintained companion code rather than duplicating that code in prose. The Langfuse build, for example, exposed cases where a healthy service or a successful response did not prove the intended application behavior. A Context Skill helps the agent avoid repeating such mistakes. It is evidence with a scope, not a guarantee of a perfect solution. New versions, providers, and requirements need their own verification. The two skill types work together: the Package Skill carries the executable workflow; the Context Skill explains relevant lessons behind a working implementation.
-->

---

## Langfuse, across six hosts

<div class="two-col">
<div>

```yaml
# Excerpt of langfuse-vultr/colors.yml
profile: langfuse-vultr
provider-compute: vultr
provider-dns: cloudflare
provider-backend: r2
clickhouse-nodes: 3
vultr-region: ams
vultr-vpc-subnet: 10.50.0.0/24
compute-prevent-destroy: true
```

</div>
<div class="card">
<h3>One private network</h3>
<p>1 application host connects to</p>
<p>1 self-hosted Neon / Postgres host<br>1 Redis host<br>3 ClickHouse hosts with Keeper</p>
<p class="small">Cloudflare fronts the app. R2 stores objects and backups.</p>
</div>
</div>

<p class="small">Checks cover application read-back and network access. A recovery rehearsal restores data and boots the application. <a href="https://www.getcolors.ai/blog/langfuse-six-machines">Read the build report</a>.</p>

<!--
Allow about ninety seconds. This is an excerpt from the actual six-machine Vultr configuration described on the Colors website, not a complete runnable configuration. The application host runs Langfuse web, worker, and Caddy. A separate host runs self-hosted Neon for Postgres; Redis has its own host; the three ClickHouse hosts carry their Keeper quorum. R2 is an external object store and is not counted among the six machines. The package provisions resources and coordinates configuration across the tiers. Its checks include application ingestion and read-back, permitted network connections, and required refusals. Recovery is a separate rehearsal command that restores both stores and boots the application against restored data. The historical build report records eleven converges and lessons that informed the checks. This is why the workflow needs evidence beyond an exit code from the provisioning tool.
-->

---

## Run the Red package without an agent

```sh
npx skills add getcolors/langfuse
cp .agents/skills/package-langfuse-red/red ./red
chmod +x red
```

With your completed `colors.yml` in the working directory:

```sh
./red build              # Render files without credentials
./red create --dry-run   # Walk the workflow without side effects
./red create             # Deploy and run the package's checks
```

<p class="small">Red uses Bun. Live execution needs the package's CLI dependencies and deployment credentials.</p>

<!--
Allow about ninety seconds. These commands use the Langfuse package's documented launcher interface. Installation copies the Red payload into the working directory and makes it executable. The package needs a complete colors.yml and its documented dependencies; the preceding excerpt is not enough. The build command renders locally without provider calls or credentials. The dry run walks the workflow while skipping side effects; it is not proof that a live deployment will succeed. The create command performs the actual convergence and runs the package's checks, so only run it in an authorized environment with the required credentials. No model participates in these launcher commands. A CI runner can execute the same reviewed code. If the installed skill is updated, copy the launcher again, because the local launcher is a copy of the payload.
-->

---

## Keep production access in your deployment process

<div class="flow">
<div class="card"><h3>Author and test</h3><p>The agent writes the workflow in an environment without production credentials.</p></div>
<div class="card"><h3>Review and pin</h3><p>Your team approves the code, dependencies, and intended changes.</p></div>
<div class="card"><h3>Execute</h3><p>An authorized operator or CI runner supplies credentials and runs that version.</p></div>
</div>

<p class="muted">Your execution environment enforces the access boundary. Colors does not require an agent in production.</p>

<!--
Allow about ninety seconds. This is a deployment pattern a team can implement, not an automatic security boundary supplied by Colors. The development environment can omit production credentials while the agent writes code and performs local rendering and tests. Review and pin the resulting version before an operator or CI runner executes it. That runner needs the permissions required by the actual operations. Keeping credentials local says little about which processes can access them. Separation depends on the environment and its controls. If an agent runs inside the credentialed environment, it may have access under that environment's permissions. The key product distinction is that Colors does not require that arrangement. Existing change approval and credential management processes can remain responsible for authorizing production execution.
-->

---

<!-- _class: cta -->

<span class="badge">Online · Free · One hour</span>

# Join the Community Town Hall

<div class="two-col">
<div>

**Friday, 18 September 2026**  
17:00 CEST / 15:00 UTC

See a live provisioning demo, discuss the roadmap, and bring your infrastructure questions.

[Register for the Town Hall](https://luma.com/ci9bek4c)

</div>
<div class="qr">

<img src="assets/town-hall-qr.svg" width="210" height="210" alt="QR code for Community Town Hall registration" />

<p class="small">luma.com/ci9bek4c</p>

</div>
</div>

<!--
Allow about one minute. Invite the audience to the Community Town Hall on Friday, 18 September 2026, at 17:00 CEST, which is 15:00 UTC. It is online, free, and scheduled for one hour. The registration link and QR code both open https://luma.com/ci9bek4c. Describe the session as a live provisioning demo, roadmap discussion, and Q&A. Encourage attendees to bring a concrete infrastructure requirement or a question about how the workflow would fit their deployment process. Leave this slide visible while taking questions. Supporting resources for follow-up are https://www.getcolors.ai/skills and https://www.getcolors.ai/#workflow. Registration for the Community Town Hall is the primary action for this introduction.
-->
