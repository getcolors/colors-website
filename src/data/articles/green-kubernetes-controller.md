# Green Workflows, Reconciled by Kubernetes

A Green workflow can provision infrastructure when a developer runs it. With `green.kubernetes`, that same workflow can become part of a controller that keeps checking whether the infrastructure still exists and repairs it when necessary.

We tested this on DigitalOcean Kubernetes (DOKS). A controller running in the cluster provisioned Redis on a separate Droplet. We deleted that Droplet through the DigitalOcean API. The controller detected its absence, ran the existing workflow, and brought Redis back without another command from us.

The measured recovery took **5 minutes and 46 seconds**. Authenticated writes and reads passed on the replacement. The previous data was gone: this implementation restores the service, but does not automatically restore its data from backup.

This article walks through the new Green controller library, using Redis as a concrete example. It is an early development implementation with an explicit single-process execution boundary.

Green turns infrastructure workflows into Kubernetes operators with a small Clojure adapter. It reduces the controller code needed to connect Kubernetes, infrastructure provisioning, and Ansible configuration. The adapter still has to define trustworthy observation, repeatable operations, credentials, and recovery behavior. This implementation uses OpenTofu; Terraform has not been tested in this path.

## Give a workflow an observation loop

A command-line invocation has an ending. Once a workflow succeeds, its caller can exit. Infrastructure can change afterward: someone deletes a server, a service stops responding, or a configuration change needs applying.

`green.kubernetes` supplies the loop around that workflow:

1. Read the custom resource describing the desired state.
2. Validate its configuration and resolve its infrastructure identity.
3. Observe the actual infrastructure.
4. Run the package's convergence callback when required.
5. Publish status, then check again at the configured interval.

Failures schedule retries. A healthy, matching observation avoids another workflow execution. This matters for Redis because its full create workflow includes an acceptance test that restarts Redis; repeating that on every poll would interrupt a healthy service.

Kubernetes holds the desired state and controller status. The package still owns the infrastructure operations and the definition of health.

## Register Clojure functions

The controller calls registered Clojure functions directly. Package code is selected when building the controller program. A custom resource supplies configuration; it cannot select arbitrary code to load.

There are five callbacks:

| Callback | Responsibility |
| --- | --- |
| `:validate` | Reject invalid package configuration. |
| `:identity` | Identify the backend and profile that own the infrastructure. |
| `:observe` | Report whether infrastructure exists, matches, and is ready. |
| `:converge` | Run the workflow needed to reach the desired state. |
| `:delete` | Run repeatable cleanup when destruction is requested. |

The Redis adapter registers them like this:

```clojure
(defn package []
  {:resource {:group "colors.getcolors.ai"
              :version "v1alpha1"
              :plural "redisdeployments"
              :kind "RedisDeployment"}
   :validate validate
   :identity identity
   :observe observe
   :converge converge
   :delete delete})
```

Its convergence callback invokes the existing Redis workflow with `green.workflow/run`. It also records the successful configuration hash and provider ID on persistent storage. The observation callback uses that record to recognize a deployment that has already converged.

Starting the controller is ordinary Clojure:

```clojure
(require '[colors.redis :as redis]
         '[green.kubernetes :as k8s]
         '[green.kubernetes.client :as client])

(def runtime
  (k8s/start!
    (k8s/controller
      {:packages [(redis/package)]
       :client (client/kubectl-client {:in-cluster? true})
       :namespace "colors-redis"
       :workers 1
       :poll-ms 2000})))

;; During graceful shutdown: wait for active work to finish.
(k8s/stop! runtime)
```

This is an operator architecture: application-specific code reconciles a custom resource. Green provides the reusable lifecycle and workflow execution layer. Each package gets a separate resource type with its own schema.

## From colors.yml to a custom resource

The package configuration that would live in `colors.yml` moves under `spec.config`. The surrounding Kubernetes fields add identity within the API, reconciliation timing, suspension, and deletion policy.

For example, this abbreviated `colors.yml`:

```yaml
profile: redis-dev
digitalocean-region: ams3
digitalocean-size: s-1vcpu-2gb
r2-bucket: redis-state
# Remaining Redis and backend configuration follows.
```

maps to the corresponding fields in this complete resource template. Replace both account placeholders, the image digest, and both documentation-only SSH CIDRs before applying it. The buckets must already exist, and the controller needs credentials for them.

```yaml
apiVersion: colors.getcolors.ai/v1alpha1
kind: RedisDeployment
metadata:
  name: redis-dev
  namespace: colors-redis
spec:
  state: running
  suspend: false
  reconcileInterval: 60s
  deletionPolicy: Retain
  config:
    profile: redis-dev
    provider-compute: digitalocean
    provider-backend: r2
    redis-image: "docker.io/library/redis:7.2.16@sha256:<IMAGE_DIGEST>"
    redis-port: 6379
    redis-backup-r2-bucket: redis-backup
    redis-backup-r2-endpoint: "https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com"
    redis-backup-r2-region: auto
    redis-backup-oncalendar: "*-*-* 00/6:00:00"
    redis-backup-retention-days: 7
    redis-backup-max-age-hours: 8
    digitalocean-region: ams3
    digitalocean-size: s-1vcpu-2gb
    digitalocean-image: ubuntu-24-04-x64
    digitalocean-ssh-sources:
      - "192.0.2.10/32" # Replace with controller worker egress IP.
      - "198.51.100.10/32" # Replace with developer egress IP.
    r2-bucket: redis-state
    r2-endpoint: "https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com"
```

The profile identifies the package deployment. Its full infrastructure identity also includes the state backend endpoint and bucket. Those values are immutable once established. A namespace separates Kubernetes objects; it does not automatically separate their external infrastructure.

Credentials belong in a Kubernetes Secret injected into the controller. The Redis adapter explicitly accepts the DigitalOcean token and the two R2 credential pairs. It rejects unrelated `COLORS_PAR_*` overrides so the resource remains the source of desired configuration.

## Apply, inspect, and request a check

First install the package CRD, RBAC, controller Deployment, persistent volume, and Secrets. The [Redis operator repository](https://github.com/getcolors/redis-operator) includes an installation renderer and a Green installation workflow. The controller image includes the tools its workflows call: OpenTofu, Ansible, SSH, and the relevant clients.

With your kubeconfig targeting that cluster:

```bash
kubectl apply -f redis-deployment.yml
kubectl -n colors-redis get redisdeployments -w
```

Use `describe` for the resource's status and conditions:

```bash
kubectl -n colors-redis describe redisdeployment redis-dev
```

A fresh annotation token requests reconciliation without changing the desired infrastructure:

```bash
kubectl -n colors-redis annotate redisdeployment redis-dev \
  colors.getcolors.ai/reconcile-request="$(date +%s%N)" \
  --overwrite
```

This requests an observation. If the deployment already matches and is healthy, the controller leaves it alone. Reapplying an unchanged manifest does not force workflow execution.

Green's step progress appears in the controller's stdout:

```bash
kubectl -n colors-redis logs -f \
  deployment/colors-redis-operator --tail=100
```

You will see progress through infrastructure, Ansible configuration, and acceptance checks. The adapter currently discards captured subprocess output, so these logs do not contain complete Ansible or OpenTofu diagnostics. Status uses generic failure reasons to avoid exposing credentials.

## What happened when we deleted Redis

Our live test first verified authenticated Redis health and wrote a unique marker. It identified the exact owned Droplet and excluded the Kubernetes worker before issuing the deletion request.

The controller's next observation queried DigitalOcean for the recorded Droplet ID. A confirmed HTTP 404 established absence. An authentication failure, unreadable state, or provider error would instead cause a retry; none is treated as permission to create another server.

The convergence callback then ran the existing Redis workflow. OpenTofu refreshed state and recreated the missing Droplet. Ansible configured Redis, and acceptance checks verified the result. The resource returned to `Ready` without a manual create command or a configuration change.

The test measured **346 seconds from deletion acceptance to verified recovery**. A new provider ID confirmed replacement, and authenticated write/read checks passed. The old marker did not survive.

A separate backup rehearsal passed by creating a backup and restoring it into a scratch instance. That demonstrates the backup path works; it does not establish automatic recovery of the deleted instance's data. A later graceful controller restart preserved the replacement Droplet and its healthy state.

## Suspension, deletion, and concurrent work

To pause new reconciliation:

```bash
kubectl -n colors-redis patch redisdeployment redis-dev \
  --type=merge -p '{"spec":{"suspend":true}}'

kubectl -n colors-redis wait redisdeployment/redis-dev \
  --for=jsonpath='{.status.phase}'=Suspended --timeout=15m
```

Resume by setting `suspend` to `false`. Suspension lets active work finish and leaves Redis running. This Redis adapter currently supports only `state: running`; it does not implement service stop/start.

Deletion defaults to `Retain`: removing the custom resource leaves external infrastructure intact. With `Destroy`, a finalizer keeps the resource present while the package deletes its owned infrastructure and verifies absence. Suspension does not override that deletion policy. Externally managed state and backup buckets remain.

Green serializes whole workflows by infrastructure identity within one process. Equal identities share that lock, including across registered types. This prevents concurrent convergence of one profile inside that process, but conflicting resources would still express conflicting desired states.

The deployment uses one replica, `Recreate`, and a persistent volume for working files and SSH keys. Remote infrastructure state alone cannot recover those private keys. Graceful shutdown waits for active workflows.

These measures do not fence a disconnected old controller. Other processes, human invocations, and CI runs do not share the controller's lock. Confirm that an old controller and its operations have stopped before replacing it. Distributed coordination and durable workflow recovery remain future work.

## A new caller for Green

The useful change is that a successful workflow run can now be followed by continued observation. Kubernetes stores the desired state; Green runs trusted package functions to converge external infrastructure toward it.

The live Redis test makes that boundary concrete: automatic service replacement works, while automatic data restoration and safe operation across multiple controller processes still need implementation. For the controller contract and a smaller local example, start with [Green's Kubernetes documentation](https://github.com/getcolors/green/blob/main/docs/kubernetes.md) and its [local Kubernetes example](https://github.com/getcolors/green/tree/main/examples/kubernetes).
