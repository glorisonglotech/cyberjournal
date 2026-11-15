> [!NOTE]
> **Room notes.** Credentials, hashes and flags are redacted; output is
> illustrative. Complete the room yourself to obtain the real values.

## Executive summary

Simple CTF is a compact chain that exercises the full beginner loop: web
enumeration, a public vulnerability in a CMS, credential discovery, SSH access and
a sudo misconfiguration. It is small enough to finish in one sitting and complete
enough to rehearse the whole method.

## Room information

| Field | Value |
| --- | --- |
| Platform | TryHackMe |
| Room | Simple CTF |
| Difficulty | Easy |
| Operating system | Linux |
| Category | Web exploitation, Linux |
| Skills | Web enumeration, CMS exploitation, sudo abuse |

## Objectives

- Enumerate a small web application completely.
- Identify a CMS and its version, then find a matching public issue.
- Convert access into a shell and then into a stable session.
- Recognise a sudo rule that permits privilege escalation.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Service discovery |
| `gobuster` | Directory enumeration |
| Burp Suite | Request manipulation |
| `searchsploit` | Exploit research |
| `linpeas` | Local enumeration (optional) |

## Initial reconnaissance

```bash
nmap -Pn -sV -sC -p- <room-ip> -oN nmap-simple.txt
```

Expect SSH, HTTP and possibly one additional service. The web application is the
entry point; SSH is the destination.

## Enumeration

### Web

```bash
gobuster dir -u http://<room-ip>/ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,txt
```

Look for:

- A CMS install path (`/simple`, `/cms`, `/admin`).
- `robots.txt` and `README` files.
- Version files (`/cms/version.php`, `CHANGELOG`).
- A login page and a search feature.

### CMS identification

```bash
curl -s http://<room-ip>/<cms-path>/ | grep -iE 'generator|version'
```

Version identification matters: an exploit for the wrong version wastes time and
can damage the instance.

## Vulnerability identification

The room's CMS version has a public SQL injection in a search feature. Confirm the
injection manually before using a tool:

```bash
curl -s "http://<room-ip>/<cms-path>/search.php?search=test'"
```

A changed response or a database error confirms the parameter is unsanitised.
Then use a targeted tool run to extract only the credential material the room
provides.

```bash
sqlmap -u "http://<room-ip>/<cms-path>/search.php?search=test" \
  --batch --dbs
```

Keep the scope tight. The room needs one table, not a full dump.

## Exploitation

Two access paths are usually available: an authenticated admin panel with a file
upload, or a credential found in the database that works over SSH.

SSH is cleaner:

```bash
ssh <user>@<room-ip>
```

If the password does not work, check whether the username differs in case, and
whether the service requires a key.

> [!TIP]
> Record which table produced the credential. In a real assessment, that is the
> difference between "a password was reused" and "the CMS database stores
> plaintext credentials".

## Privilege escalation

Start with the cheapest checks:

```bash
id
sudo -l
find / -perm -4000 -type f 2>/dev/null
```

The intended path is a sudo rule allowing a text editor or pager to run as root.
If `vim` is permitted:

```bash
sudo vim -c ':!/bin/sh'
```

Verify with `id`. The important observation is that the rule grants a program with
a shell escape, not that the specific command works.

## Flags and completion evidence

Flags are redacted. Record:

- The CMS path and version.
- The injection parameter and confirmation response.
- The sudo rule as printed by `sudo -l`.

## Lessons learned

- Web enumeration order matters: CMS path before brute force.
- Version accuracy decides whether an exploit is relevant.
- Manual confirmation before automation keeps the evidence defensible.
- A sudo rule on an editor is root, regardless of intent.
- Stable access (SSH) beats a fragile web shell.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| SQL injection | Parameterised queries, input validation |
| Plaintext credentials in CMS data | Hash passwords, rotate on breach |
| Sudo rule on an editor | Remove; use a constrained wrapper |
| Outdated CMS | Patch and remove unused plugins |

## References

- TryHackMe — Simple CTF room.
- GTFOBins — sudo and SUID escapes.
- OWASP — SQL injection prevention.
