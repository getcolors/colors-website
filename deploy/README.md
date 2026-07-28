# Deploy trigger

CI does not decide what gets deployed. Every repository in the profile does the
same thing after publishing an image — open an SSH connection and close it — and
the server reconciles **every** application in `colors.yml` in response.

```
push to main ──> build ──> manifest ──> ssh <server>   (that is the whole deploy job)
                                          │
                                          └─> ForceCommand: once-deploy-ping
                                                 ├─ reads colors.yml
                                                 └─> once update <each host>
```

Nothing on the CI side names a host, an image, or an application, and neither
does this script — it reads `once.applications[].host` out of `colors.yml` at
run time. **Adding an application means editing `colors.yml` and nothing else.**

## Why reconcile everything instead of the image that was just built

Because an image can back more than one application, and because the alternative
is worse. Telling the server *which* host to update means the client sends an
argument, which means the forced command has to parse `SSH_ORIGINAL_COMMAND` —
the classic place SSH forced commands grow injection bugs. A forced command that
ignores its input entirely has no input to sanitise.

The cost is honest and worth stating: a ping from `colors-redirect` also
reconciles `www.getcolors.ai`. If that update fails, `colors-redirect`'s workflow
goes red for something it did not break. With a two-application profile that is a
fair trade for having no host names in CI.

**This assumes `once update` is idempotent** — that updating an application whose
`:latest` digest has not moved is a no-op rather than an unconditional container
restart. If it is not, every website push bounces the redirect container and vice
versa. Verify that before adding a third application; if it turns out not to
hold, fix it in `once` rather than by putting host names back into CI.

## Prerequisites

- **babashka** on the server, on the deploy user's `PATH`. The script is `bb`,
  matching the green library's Clojure/Babashka toolchain. `clj-yaml` and
  `babashka.fs` are bundled with `bb` — there is nothing to install beyond the
  binary itself, and no `deps.edn`.
- **`flock`** from util-linux (already present on any normal Linux server).
- **`colors.yml` readable by the deploy user.** The script defaults to
  `/opt/colors/colors.yml`; set `COLORS_YML` if it lives elsewhere. It only ever
  reads the file.

## Install

Three pieces on the server, all as root.

**1. The script**

```sh
install -m 0755 once-deploy-ping /usr/local/bin/once-deploy-ping
/usr/local/bin/once-deploy-ping --list      # prints the hosts it would reconcile
```

`--list` parses `colors.yml` and prints the host list without deploying
anything. If it prints what you expect, the script and the profile agree. It is
not reachable over SSH — the forced command runs with no arguments no matter
what the client sends.

**2. The key restriction**

The deploy key is the one ONCE provisions from the `deploy-pubkey` provider
param. In that user's `~/.ssh/authorized_keys`, prefix its line with:

```
restrict,command="/usr/local/bin/once-deploy-ping" ssh-ed25519 AAAA...key... ci-deploy
```

`command=` is what makes the ping a ping: whatever the client asks to run, this
runs instead. `restrict` turns off pty, port, agent and X11 forwarding and
`~/.ssh/rc`, so the key cannot be used to open a tunnel either.

This is the security payoff of the whole design. Before, `SSH_PRIVATE_KEY` was an
arbitrary-command credential on a sudo-capable account — a leak was a root shell.
Now a leak is the ability to trigger a deploy of already-published images.

**3. sudo, narrowed to the `update` subcommand**

```sh
# /etc/sudoers.d/once-deploy  (install with visudo -f)
ci ALL=(root) NOPASSWD: /usr/local/bin/once update *
```

Replace `ci` with the value of the `SERVER_USER` variable.

The wildcard is deliberate and is the price of keeping `colors.yml` the single
source of truth — enumerating hosts here would reintroduce exactly the drift this
change removed. Be aware of what it does and does not buy:

- **`once destroy` stays blocked**, which was the main worry. Only `update` is
  permitted. Never write `NOPASSWD: /usr/local/bin/once`.
- **`*` in sudoers matches across argument boundaries**, so this permits
  `once update <anything>` as root, not just the hosts in `colors.yml`. It is a
  bound on the subcommand, not on the arguments.
- The script itself is stricter than sudoers: it rejects any host from
  `colors.yml` that does not match a hostname pattern, so a value like
  `--config=/etc/evil` is refused rather than passed to `once`. That check
  protects this path only — it is not a substitute for the sudoers rule.

If you would rather have the tighter grant, enumerate the commands instead and
accept that adding an application means editing this file too:

```sh
ci ALL=(root) NOPASSWD: /usr/local/bin/once update www.getcolors.ai, \
                        /usr/local/bin/once update getcolors.ai
```

## Verify

From a machine holding the deploy key:

```sh
ssh -T -n ci@<server> whoami          # runs the deploy, not whoami
ssh -T -n ci@<server>                 # same
```

Both should print `ignoring client command: whoami` (or no such line for the
second), the host list read from `colors.yml`, then a `once update` run per host.
If `whoami` actually prints a username, `command=` is not in effect and the key
is still a shell credential — stop and fix that before wiring CI to it.

## Notes

- **Exit codes.** 0 all good; 1 either a deploy failed or `colors.yml` could not
  be read/parsed; the script distinguishes a lock timeout from a deploy failure
  in its message (`flock` is given `--conflict-exit-code 75` internally so the
  two cannot be confused).
- **The lock** is `/var/lock/once-deploy.lock`, held for the whole reconcile,
  waited on for up to 900s (`ONCE_DEPLOY_LOCK_WAIT`). Pings queue; they do not
  fail fast. The script re-executes itself under `flock` to hold it — babashka's
  sandbox refuses `FileLock.release`, so the `flock` binary is used instead.
- **`colors.yml` is parsed before the lock is taken**, so a malformed profile
  fails immediately instead of making a queued ping wait behind it.
- **A failing host does not stop the others.** All hosts are attempted, then the
  script exits non-zero if any failed, so one broken application still reports
  the state of the rest.
- **The connection is synchronous on purpose.** The workflow's exit status is the
  deploy's exit status, so a failed deploy still turns CI red. Do not "improve"
  this into a fire-and-forget flag file that a timer picks up — that buys very
  little and loses the only signal that a deploy failed.
- A timer alone (`once update` every N minutes, no SSH from CI at all) would be
  simpler still, and would let the deploy key go away entirely. It was not chosen
  because it costs deploy latency and, again, the red build on failure.
- **Env overrides**, all optional: `COLORS_YML`, `ONCE_BIN`,
  `ONCE_DEPLOY_LOCK`, `ONCE_DEPLOY_LOCK_WAIT`. They exist to make the script
  testable off-server; the defaults are what production uses.
