> [!NOTE]
> **Machine notes.** Credentials and flags are redacted; output is illustrative.
> Complete the machine on Hack The Box for the real values.

## Executive summary

Fawn is an FTP box. The lesson is that anonymous access is a configuration choice
with consequences: a file that is readable by anyone on the network is effectively
public.

The machine also introduces a habit worth keeping: connect to the service and look
before searching for an exploit.

## Machine information

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Machine | Fawn |
| Difficulty | Beginner (Starting Point, Tier 0) |
| Operating system | Linux |
| Category | FTP enumeration |
| Skills | Service identification, anonymous FTP, file retrieval |

## Objectives

- Identify FTP and its version.
- Test anonymous authentication.
- List and retrieve files without credentials.
- Explain why anonymous write access would be worse than read access.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Port and version detection |
| `ftp` | Interactive session |
| `curl` | Scriptable retrieval |
| `wget` | Recursive download when appropriate |

## Initial reconnaissance

```bash
nmap -Pn -sV -p- <machine-ip> -oN nmap-fawn.txt
```

Expect port 21 with an FTP banner and version. The version tells you which server
software is running; the behaviour tells you whether anonymous login is allowed.

## Enumeration

```bash
nmap -Pn -p 21 --script ftp-anon <machine-ip>
```

The `ftp-anon` script attempts an anonymous login and lists the root. If it
succeeds, the share is open.

Manual confirmation:

```bash
ftp <machine-ip>
```

```text
Name: anonymous
Password: <anything, conventionally an email address>
230 Login successful.
ftp> ls
ftp> pwd
```

`pwd` matters: it tells you where you are in the filesystem, which you need for the
report.

## Vulnerability identification

Finding: the FTP service permits anonymous authentication and exposes files that
should require credentials.

Severity depends on content. A public readme is informational; a backup, key or
configuration file is high. The room's file is the flag, but the reasoning is about
the class.

## Exploitation

Retrieve the file:

```bash
ftp <machine-ip>
ftp> ls
ftp> get <filename>
ftp> bye
```

Or non-interactively:

```bash
curl -s ftp://anonymous:anonymous@<machine-ip>/<filename>
```

Read it locally:

```bash
cat <filename>
```

The flag is redacted here.

## Privilege escalation

Not applicable. FTP access does not grant a shell on this machine.

If anonymous **write** access were available, the escalation path would be
different: upload a file to a location the web server serves, or overwrite a
scheduled script. That is why write access is materially worse than read access and
should be reported separately.

## Flags and completion evidence

The flag is redacted. Record:

- The `ftp-anon` script result or the manual login transcript.
- The filename and directory.
- Whether the permissions allowed write.

## Lessons learned

- Anonymous FTP is still common in labs and legacy environments.
- Read access and write access are different findings.
- Version banners guide investigation; behaviour confirms it.
- A non-interactive `curl` request is better evidence than a screenshot.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Anonymous FTP | Disable anonymous access |
| Clear-text protocol | Replace FTP with SFTP or FTPS |
| Sensitive files on a share | Remove; store outside the served directory |
| No logging | Log and alert on anonymous logins |

## References

- Hack The Box — Starting Point: Fawn.
- RFC 959 — File Transfer Protocol.
- OWASP WSTG — Testing for anonymous FTP access.
