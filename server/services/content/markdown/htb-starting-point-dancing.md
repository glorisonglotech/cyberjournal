> [!NOTE]
> **Machine notes.** Credentials and flags are redacted; output is illustrative.
> Complete the machine on Hack The Box for the real values.

## Executive summary

Dancing introduces SMB on Windows. The lesson is that a share's permissions, not
its name, determine exposure — and that listing shares is a different operation
from reading them.

## Machine information

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Machine | Dancing |
| Difficulty | Beginner (Starting Point, Tier 0) |
| Operating system | Windows |
| Category | SMB enumeration |
| Skills | Share enumeration, null sessions, file retrieval |

## Objectives

- Identify SMB and its dialect.
- Enumerate shares with and without credentials.
- Read a share that permits anonymous access.
- Explain the difference between share permissions and NTFS permissions.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Port and SMB script enumeration |
| `smbclient` | Share listing and file access |
| `smbmap` | Permission overview |

## Initial reconnaissance

```bash
nmap -Pn -sV -p- <machine-ip> -oN nmap-dancing.txt
```

Expect 445 open (and possibly 139). Confirm the dialect and signing state:

```bash
nmap -Pn -p 445 --script smb-protocols,smb2-security-mode <machine-ip>
```

## Enumeration

```bash
smbclient -L //<machine-ip>/ -N
smbmap -H <machine-ip> -u ''
```

`-N` means no password. If the server allows a null session, the share list is
returned without authentication.

Interpret the permissions column:

```text
Disk    Permissions    Comment
----    -----------    -------
ADMIN$  NO ACCESS      Remote Admin
C$      NO ACCESS      Default share
WorkShares  READ, WRITE  Custom share
```

A custom share with `READ` is the target. `WRITE` would be a separate, higher-impact
finding.

## Vulnerability identification

Finding: an SMB share readable by unauthenticated users exposes files that should
require credentials.

Related issues to check in a real environment:

- Null session allowed at all.
- Share permissions broader than NTFS permissions (effective access is the
  intersection).
- Sensitive file types: scripts, backups, configuration, keys.

## Exploitation

```bash
smbclient //<machine-ip>/<share> -N
```

```text
smb: \> ls
smb: \> cd <directory>
smb: \> get <file>
smb: \> exit
```

The flag is inside one of the user directories. Read it locally; keep the value
redacted in notes.

If the share requires credentials, the room's documented default is the next
attempt — but only after confirming the share list is otherwise closed.

## Privilege escalation

Not applicable. Share access does not yield a shell. In a real assessment the next
questions would be:

- Can the readable share be written to?
- Are there scheduled tasks that read from it?
- Do the files contain credentials for another service?

Those questions are what turn a share listing into lateral movement.

## Flags and completion evidence

The flag is redacted. Record the share name, the permissions string, and the file
path within the share.

## Lessons learned

- Share permissions and NTFS permissions are separate controls.
- `READ, WRITE` on a custom share is materially worse than `READ`.
- A null session exposes the share list before authentication is attempted.
- SMB is a Windows default, not an optional service.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Null sessions | Disable anonymous enumeration |
| Over-permissive shares | Least privilege; review quarterly |
| Sensitive files on shares | Remove; use a managed secret store |
| SMB exposed broadly | Restrict to internal networks |

## References

- Hack The Box — Starting Point: Dancing.
- Microsoft — SMB share and NTFS permission documentation.
- OWASP WSTG — SMB enumeration guidance.
