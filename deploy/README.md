# Deploy trigger

CI does not decide what gets deployed. Every repository in the profile does the
same thing after publishing an image — open an SSH connection and close it — and
the server reconciles **every** application in `colors.yml` in response.

```
push to main ──> build ──> manifest ──> ssh <server>   (that is the whole deploy job)
                                          │
                                          └─> ForceCommand: once-deploy-ping
                                                 └─> once update www.getcolors.ai
                                                     once update getcolors.ai
```

Nothing on the CI side names a host, an image, or an application. Adding an
application to the profile means adding it to `colors.yml` and to `HOSTS` in
`once-deploy-ping`; no workflow file changes, in any repository.

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

## Install

Three pieces on the server, all as root.

**1. The script**

```sh
install -m 0755 once-deploy-ping /usr/local/bin/once-deploy-ping
```

Check `HOSTS` matches `applications[].host` in `colors.yml` before installing.

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

**3. sudo, narrowed to the same two commands**

```sh
# /etc/sudoers.d/once-deploy  (install with visudo -f)
ci ALL=(root) NOPASSWD: /usr/local/bin/once update www.getcolors.ai, \
                        /usr/local/bin/once update getcolors.ai
```

List the commands explicitly. `NOPASSWD: /usr/local/bin/once` would let any
`once` subcommand run as root, including `once destroy`. Replace `ci` with the
value of the `SERVER_USER` variable.

## Verify

From a machine holding the deploy key:

```sh
ssh -T -n ci@<server> whoami          # runs the deploy, not whoami
ssh -T -n ci@<server>                 # same
```

Both should print `ignoring client command: whoami` (or no such line for the
second), then a `once update` run per host. If `whoami` actually prints a
username, `command=` is not in effect and the key is still a shell credential —
stop and fix that before wiring CI to it.

## Notes

- The lock is `/var/lock/once-deploy.lock`, held for the whole reconcile, waited
  on for up to 900s. Pings queue; they do not fail fast.
- The connection is synchronous on purpose. The workflow's exit status is the
  deploy's exit status, so a failed deploy still turns CI red. Do not "improve"
  this into a fire-and-forget flag file that a timer picks up — that buys very
  little and loses the only signal that a deploy failed.
- A timer alone (`once update` every N minutes, no SSH from CI at all) would be
  simpler still, and would let the deploy key go away entirely. It was not chosen
  because it costs deploy latency and, again, the red build on failure.
