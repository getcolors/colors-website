---
marp: true
theme: colors
size: 16:9
paginate: true
header: Colors
footer: Kubernetes in Green, Red and Blue
title: "Colors | Kubernetes controllers in Green, Red and Blue"
description: "Three native Kubernetes SDKs, the Redis Operator and DOKS Package Skills, and Green, Red and Blue live verification on 16 September 2026."
author: Colors
lang: en
---

<!-- _class: lead -->

<span class="badge">New in Colors · September 2026</span>

# Register the workflow.<br>Let a controller keep it converged.

Green, Red and Blue reconcile a custom resource by running the same native workflow a launcher runs.

`redis-operator` supplies the controller; `doks` supplies its cluster. Both packages ship in all three colours, verified live on 16 September 2026.

<p class="small"><a href="https://www.getcolors.ai/slides/green-kubernetes/green-kubernetes.pdf">Download the PDF</a> · <a href="https://www.getcolors.ai">getcolors.ai</a></p>

<!--
Allow about one minute. Colors now has three native Kubernetes controller SDKs: Clojure/Babashka, TypeScript/Bun, and Python/uv. Redis Operator calls the matching Redis workflow; DOKS provisions the managed cluster underneath it and does not itself run a Kubernetes controller. Distinguish two evidence periods on 16 September: the original Green cycle was fully torn down, then later Red and Blue verification created another deployment that remained running at the handoff. Do not present the old account-empty result as current. The later verification is recorded in workspace/kubernetes-ports-handoff.md and the deployments' per-colour evidence. The catalog exposes all six Package Skills.
-->

---

## A launcher run ends. A controller keeps observing.

<div class="two-col">
<div class="card">
<h3>One create</h3>
<p>Reads <code>colors.yml</code>, converges, runs the checks, and exits.</p>
<p>Nobody observes the infrastructure after the exit code.</p>
</div>
<div class="card">
<h3>One controller</h3>
<p>Reads a custom resource every poll and observes the infrastructure every <code>reconcileInterval</code>.</p>
<p>Converges only when the observation does not match the desired state.</p>
</div>
</div>

The controller is an optional library in each SDK. It calls registered package functions and loads no code from a resource.

<!--
Allow about one minute. The introduction deck ends with a reviewed program that a person or a CI runner executes. That program has one weakness: it stops. After the exit code nothing watches the Droplet, and a deleted machine stays deleted until someone runs create again. A Kubernetes controller closes that gap by making the same workflow run on a schedule against a desired state that lives in a custom resource. The design decision worth stating is what the controller does not do. It does not execute skill documents, launch Jobs, or load code selected by a resource. You register trusted packages in the controller program, and each package owns one namespaced CRD. Polling uses kubectl with an explicit context or in-cluster authentication, which the documentation labels as intended for local development.
-->

---

## Three native runtimes, one controller contract

| Colour | Runtime | Kubernetes SDK |
| :--- | :--- | :--- |
| Green | Clojure / Babashka | `green.kubernetes` |
| Red | TypeScript / Bun | `red/kubernetes` |
| Blue | Python / uv | `blue.kubernetes` |

`./green`, `./red` or `./blue` selects the **CLI**. The `image` digest selects the **controller**. All three CLIs can operate the verified Red and Blue images.

Both packages share desired state and ownership keys, with byte-identical rendered artifacts. Run one lifecycle operation per profile at a time.

<!--
Allow about ninety seconds. These are native ports, not wrappers around Babashka. Green observation keys have question marks; Red and Blue use exists, matches and ready. Installing a Blue launcher does not switch the running controller. Build the desired colour with scripts/image.sh registry revision colour, then review and pin its digest in colors.yml. Preserve profile, backend and credentials when changing CLI. Probe dispatch follows the image runtime. Runtime switches may require one convergence to establish that runtime's convergence record. Shared keys do not grant a distributed lock across separate processes; byte parity covers generated artifacts, including custom-namespace operator manifests. Both SDK ports passed actual Kubernetes API tests using in-memory infrastructure adapters: stale status writes, finalizers, readiness, idempotence, stopped state, Retain and Destroy. These SDK tests did not destroy the live Redis deployment.
-->

---

## The controller in one slide

- The loop polls the custom resources with kubectl and coalesces queued work per resource.
- One process-wide lock per infrastructure state identity serializes whole workflows, across types and controller instances.
- The controller adds the finalizer `colors.getcolors.ai/infrastructure` before any effect.
- Every status write carries the `resourceVersion` of the snapshot it came from.

<p class="small"><code>spec.state</code> running · <code>spec.suspend</code> · <code>spec.reconcileInterval</code> 60s · <code>spec.deletionPolicy</code> Retain or Destroy · the <code>colors.getcolors.ai/reconcile-request</code> annotation</p>

<!--
Allow about ninety seconds. Walk the four mechanisms in order. Polling lists the resources every poll-ms and enqueues each one; the queue holds each resource once. Reconciliation runs only when the resource is due: its generation changed, its reconcile-request annotation token changed, it is being deleted, or nextReconcileTime has passed. The value the package's identity callback returns keys the lock, so two resources naming the same backend and profile never run workflows at the same time. The finalizer lands before the first side effect, and the controller also persists the profile and a hash of the state identity before effects and refuses later changes to them. The controller pins every status write: a concurrent spec edit makes the old write fail instead of acknowledging configuration the pass never saw. The spec fields on the last line are the operator's controls. suspend stops new convergence while active work finishes. A changed reconcile-request token schedules a check; an unchanged manifest forces nothing. state running is the only state redis-operator supports in this release. deletionPolicy defaults to Retain, which removes only the finalizer.
-->

---

## A package registers five callbacks

| Callback | Returns |
| :--- | :--- |
| `validate` | Errors for an invalid configuration |
| `identity` | A stable name for the backend and the profile |
| `observe` | Existence, configuration match and readiness from a read-only look |
| `converge` | The package's converge workflow outcome |
| `delete` | The package's delete workflow outcome, repeatable |

`converge` and `delete` call the same native workflow graphs a launcher runs.

<p class="muted">One controller process. It implements no distributed leases or fencing.</p>

<!--
Allow about ninety seconds. Every callback receives spec.config as its runtime's map or object with a profile, which defaults to namespace, two dashes, name, plus the event and the full resource snapshot. Validation errors keep the resource Invalid until the configuration or the request token changes, and the controller never copies error text to status. Observation must be read-only; it answers whether the infrastructure exists, whether it matches the configuration, and whether it is ready. Matching configuration with ready false waits and re-observes without converging again. A nonzero exit or an exception from converge causes a retry with backoff. Finalization waits until observation reports absence. Now the caveat, and say it plainly: this version supports one controller process. A Recreate Deployment and graceful shutdown help ordinary upgrades, but nothing prevents two writers during a node failure or a network partition. Human or CI launcher runs in other processes do not share this lock. The documentation names distributed leases, fencing, a watch client, and durable workflow recovery as separate future work.
-->

---

## redis-operator provisions one Droplet per RedisDeployment

<div class="two-col">
<div class="card">
<h3>The adapter</h3>
<p>Imports the pinned <code>redis</code> package workflow. Only a confirmed provider 404 counts as absence; an authentication, provider, or state-read error is retried, never recreated.</p>
</div>
<div class="card">
<h3>The guards</h3>
<p><code>compute-prevent-destroy</code> stays on while the controller converges. Only an explicit <code>deletionPolicy: Destroy</code> lifts it.</p>
</div>
</div>

<p class="small">Verbs: <code>build</code>, <code>create</code>, <code>check</code>, <code>rehearse</code>, <code>drill</code>, <code>restart</code>, <code>delete</code>. Redis 7.2 runs on a Droplet outside the cluster; the controller Pod runs the workflow.</p>

<!--
Allow about ninety seconds. redis-operator is two halves under one pin: the controller image, whose entry point runs the selected native runtime in-cluster, and the Package Skill that installs the controller into an existing cluster from a non-secret colors.yml, applies one RedisDeployment, and carries the operational verbs. The adapter reads owned compute state, asks the DigitalOcean API for that exact Droplet ID, and checks the recorded name. A confirmed HTTP 404 is the one absence proof, and it is relative to the token's team: a Droplet in another team also answers 404, so rotating the Secret to a token from a different team would make the operator recreate the Droplet there while the original keeps running. Rotate within one team. A healthy observation also checks region, size, image, the recorded public IP, and an authenticated PING over SSH. The verbs on this slide are the launcher's: check polls for Ready, rehearse restores a backup set into a scratch container under an acknowledged suspension, drill deletes the owned Droplet and waits for a replacement, restart rolls the controller, and delete patches Destroy and waits for the finalizer. Only the five COLORS_PAR credentials enter the Pod, from a Secret; startup refuses any other override.
-->

---

## The controller image and its volume

<div class="two-col">
<div class="card">
<h3>On the volume</h3>
<p>A failed converge or delete is kept at <code>/data/work/&lt;profile&gt;/failures/</code>, 20 newest, every <code>COLORS_PAR_*</code> value masked to <code>***</code>.</p>
<p>SSH keys and convergence records persist on the volume. Green also persists its dependency caches; Red and Blue dependencies are installed in their images.</p>
</div>
<div class="card">
<h3>The image</h3>
<p><code>scripts/image.sh</code> builds <code>linux/amd64</code> from the checked-out commit and pushes it to the deployment's registry.</p>
<p>The deployment pins the printed digest as <code>image</code> in <code>colors.yml</code>.</p>
</div>
</div>

<!--
Allow about one minute. The volume matters because remote state does not contain the machine's private SSH keys; persisting them is what lets the controller reach a Droplet after a Pod restart. The failure directory exists because the adapter suppresses raw workflow output on stdout so no secret reaches a log; the retained file holds the failing step and exit code, the workflow's error text with the play's or OpenTofu's output, the Ansible recap, and the trace, with every credential value replaced before the file is written. Nothing from those files reaches stdout, the resource status, or events; check prints how many files it holds and the newest name. Green caches gitlibs, m2, deps.clj and cpcache as subPaths of the same claim as data and SSH keys. Red and Blue images install their native dependencies at build time. A runtime switch may converge once to establish its own convergence record; same-runtime restart verification checks that convergence did not run. The image is a separate pin from the package: a change to any controller, adapter or probe needs a new image, a change on the package side needs a new launcher pin, and a change to the CRD needs both. Build from the reviewed revision and select green, red or blue as the image target; the default build refuses a dirty tree.
-->

---

## doks is the cluster underneath

<div class="two-col">
<div class="card">
<h3>One managed cluster</h3>
<p>DigitalOcean DOKS or Vultr VKE, named after the profile, through colors-compute's <code>managed-kubernetes</code> kind.</p>
</div>
<div class="card">
<h3>One optional registry</h3>
<p>Deployment-owned, named after the profile, integrated with the cluster so DOKS places the pull Secret in every namespace.</p>
</div>
</div>

<p class="small">Verbs: <code>build</code>, <code>create</code>, <code>check</code>, <code>kubeconfig</code>, <code>registry</code>, <code>delete</code>. A consumer deployment reads <code>.colors/&lt;profile&gt;/kubeconfig</code> by path and never commits it.</p>

<!--
Allow about one minute. doks creates no machines, so the Compute Provider Standard's machine API and the SSH standards do not apply; the library's managed-kubernetes kind owns the journal, the plan safety and the kubeconfig write. The registry is a package-owned OpenTofu stage with its own state key on the same backend, one digitalocean_container_registry resource with prevent_destroy bound to compute-prevent-destroy. Linking it to the cluster is one API call, and the result is that workloads pull from registry.digitalocean.com slash profile without any package-side credential rotation. The registry verb writes a one-hour docker push config that image.sh consumes. The kubeconfig handoff is by path: the redis-operator-doks deployment's envrc exports KUBECONFIG pointing at the doks deployment's rendered file, and kube-context in its colors.yml names the context. Delete removes the registry integration, the cluster, then the registry, and prints one line per stage. DigitalOcean removes the worker Droplets and the cluster firewalls asynchronously over the following minutes, so check fails from then on.
-->

---

## Historical Green cycle · 16 September 2026

<div class="small">

| Step | Result |
| :--- | :--- |
| `doks` create | Cluster and registry in 6 min 16 s. A second create found nothing to do in 13 s. |
| First operator create | Ready at generation 1 |
| Image update | The controller rolled and ran no redundant create |
| Drill | Deleted Droplet 600954837; replacement 600968621 healthy after 5 min 21 s, resource UID unchanged |
| Rehearsal | Suspended at generation 2, resumed at generation 3 |
| Restart | Passed on the second attempt; the new pod was up in about 20 s from cached dependencies |
| Destroy delete | The finalizer destroyed the Droplet, then the verb removed the namespace and the CRD |
| Shutdown | Cluster and registry destroyed. Account empty. |

</div>

<!--
Allow about two minutes. These are the original Green run's historical numbers, not the later Red/Blue deployment. Read them from its evidence files. The doks infrastructure stage took 356 seconds, the registry 19 and the link 1; the idempotent second create spent 13 seconds in the infrastructure stage. The first operator create reached Ready and Converged at generation 1 on Droplet 600954837. The second image digest rolled the controller, which observed the existing Droplet healthy and ran no create. The drill proved ownership first, including that the ID was not the DOKS worker, round-tripped a marker, then deleted exactly that Droplet at 07:49:33; the controller logged droplet-absent 17 seconds later and the replacement passed a fresh authenticated write at 07:54:54. The resource UID and generation did not change. Now the caveat that must be said out loud: the prior marker did not survive. The replacement is a fresh Droplet with a new password and an empty data volume. Backup sets in R2 survive, and nothing restores them automatically. The drill proves service recovery, not data recovery. The rehearsal ran under an acknowledged suspension, which is a one-shot check, not a lease. The finalizer took 107 seconds during the Destroy delete. The account audit after the DigitalOcean cleanup window read zero Droplets, zero clusters, zero firewalls and no registry; the three R2 buckets were kept on purpose.
-->

---

## Later Red and Blue verification · 16 September 2026

<div class="small">

| Check | Observed result |
| :--- | :--- |
| DOKS | Red created cluster and registry; Blue converged the same resources; all three CLIs passed checks |
| Native controllers | Blue created Redis; Red adopted the same Droplet; both passed health, backup restore and restart |
| CLI compatibility | Green, Red and Blue CLIs all probed the Red image |
| Red recovery drill | 601089393 → 601094147; old host absent, UID and generation unchanged, fresh authenticated write passed |
| Final handoff snapshot | Ready at generation 5, Red controller; cluster, registry, volume and Redis remained running |

</div>

<p class="small">Service recovery does not restore deleted-host data automatically. Backup restoration was verified separately. Live provider: DigitalOcean; Vultr: fixture parity.</p>

<!--
Allow about ninety seconds. This is a later deployment than the historical Green cycle. The Red replacement encountered a dpkg lock and recovered through the controller's normal retry. All three CLIs and both native images were checked, but do not imply every CLI/image combination received a full destructive cycle. The handoff records the final image digests and per-colour evidence. Package teardown was not run for this deployment: deletion guards and SDK finalizer behavior were checked separately. Protection and Retain stayed enabled. The running-state statement is the 16 September handoff snapshot, not an assertion of present uptime. Evidence is under doks-dev/evidence/2026-09-16 and redis-operator-doks/evidence/2026-09-16 on GitHub.
-->

---

## Four fixes from the original Green run

- `check` read `phase=Reconciling reason=Reconciling` on a healthy resource. It now polls every 5 s for up to 180 s through the periodic pass.
- A failed first Ansible attempt left nothing readable. The controller now retains masked failure logs, and `check` prints `failures retained: N`.
- A probe exec hit `Unexpected end of ZLIB input stream` in a pod still unpacking its toolchain. Every exec now waits for that pod's own `RedisDeployment controller running` line, and Green's caches live on the volume.
- The delete patch failed with `the server rejected our request due to an error in our request` because status writes had moved the `resourceVersion`. Patches now retry when only status moved.

<!--
Allow about two minutes. Each fix follows from one fact about the loop: it publishes two status writes per pass, every pass, and each write moves the resourceVersion. With a 30 second reconcile interval the resource reads Reconciling for most of each interval, so two check reads 20 seconds apart both failed on a resource the controller had just logged as converged. The fix polls until phase Ready with observedGeneration equal to the generation; Invalid, Blocked, suspension and deletion end the wait at once, and the create and drill waits tolerate Failed because the controller retries. The restart failure had three causes at once: the verb accepted a status write from the old controller draining as proof of the new one, it exec'd into a pod still downloading clojure-tools, and two processes unpacking one archive corrupted it for both. The passing restart compares lastReconcileTime to the new pod's own startTime and waits for the controller-running log line since that start. The patch race is the same fact from the other side: every launcher write opens with a test on the resourceVersion, and the snapshot was routinely stale. The retry re-reads and re-issues only when spec, deletionTimestamp and UID still match, at most five times. A fifth fix is smaller: doks delete now reports leftovers instead of throwing, and image.sh keeps root-owned docker state out of the deployment directory.
-->

---

## A later failure was captured

Earlier Green creates sometimes failed at `redis/ansible`, then passed on retry. Those attempts had no retained diagnostic; their cause remains unproven.

During the later Red recovery drill, the retained log identified **Ubuntu's dpkg lock** on the replacement Droplet. The controller retried and converged without manual intervention.

Read masked diagnostics at `/data/work/<profile>/failures/<file>`.

<p class="muted">This explains the captured later failure, not every earlier Ansible exit. Create and recovery waits tolerate Failed while the controller retries.</p>

<!--
Allow about one minute. Keep observation and inference separate. The earlier Green failures lacked captured output, so the later dpkg-lock error does not establish their cause. The Red drill replaced Droplet 601089393 with 601094147, retained the failed installation output and retried successfully. One historical failure log remained in the final Ready snapshot. The earlier theory about unattended upgrades restarting sshd was never established. Other limits still apply: token-relative provider 404s, drift from retired image slugs or resizing, suspension as a one-shot check, and no distributed fencing.
-->

---

## Find them in the catalog

Package recipes now carry a `shape`, one of single-node, multi-node, kubernetes, operator, or local. It renders as a chip on the card and a filter on `/skills`. Source pages list `artifacts`: the CRD, the controller image, the rendered manifests. A Context Skill inherits the shape of its companion package.

```sh
colour=red # or green or blue
# Run each install in its own deployment directory.
npx skills add getcolors/doks --skill package-doks-$colour
npx skills add getcolors/redis-operator --skill package-redis-operator-$colour
npx skills use getcolors/skills --skill redis-operator-kubernetes
```

<p class="small"><a href="https://www.getcolors.ai/getcolors/doks">getcolors.ai/getcolors/doks</a> · <a href="https://www.getcolors.ai/getcolors/redis-operator">getcolors.ai/getcolors/redis-operator</a> · <a href="https://www.getcolors.ai/getcolors/skills/redis-operator-kubernetes">redis-operator-kubernetes</a></p>

<!--
Allow about one minute. The shape is a facet over Package Skills, never a third skill kind: an operator is still installed as a Package Skill. doks carries the kubernetes shape and redis-operator the operator shape, and the filter is reachable as /skills?shape=operator. The artifacts section exists because a controller package has files worth reading beyond the launcher; redis-operator lists the RedisDeployment CRD, the Dockerfile, and the two rendered outputs. The Context Skill redis-operator-kubernetes lives in getcolors/skills and takes its shape from its companion. Its symptom index carries the verbatim failure strings from this deck, the Reconciling read, the rejected patch, the truncated archive, the Ansible exit, so an agent that meets one of them finds the entry and the commit that fixed it. Choose a colour and run each package install and copy in its own deployment directory. For DOKS, copy .agents/skills/package-doks-$colour/$colour to ./$colour; for the operator use package-redis-operator-$colour. Repeat the copy after skill updates. The Context Skill loads on demand and records the original Green experience; use the later per-colour evidence for Red/Blue results. Repository landing pages are at getcolors.github.io/doks and getcolors.github.io/redis-operator.
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
Allow about one minute. Invite the audience to the Community Town Hall on Friday, 18 September 2026, at 17:00 CEST, which is 15:00 UTC. It is online, free, and scheduled for one hour. The registration link and QR code both open https://luma.com/ci9bek4c. Describe the session as a live provisioning demo, roadmap discussion, and Q&A, and say that the controller work in this deck is on the roadmap agenda. Leave this slide visible while taking questions. Follow-up resources are the two catalog pages, https://www.getcolors.ai/getcolors/doks and https://www.getcolors.ai/getcolors/redis-operator, the Context Skill at https://www.getcolors.ai/getcolors/skills/redis-operator-kubernetes, and the repository pages at https://getcolors.github.io/doks/ and https://getcolors.github.io/redis-operator/.
-->
