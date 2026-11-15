> [!NOTE]
> **Machine notes.** Credentials and flags from the live machine are redacted, and
> command output is illustrative. Complete the machine on Hack The Box to obtain
> the real values.

## Executive summary

Meow is the first Starting Point machine and teaches a single discipline: identify
the service before selecting a tool. The box exposes Telnet, and the "exploit" is
understanding what a login prompt without credentials means.

Its instructional value is in the order of operations: scan, identify, connect,
authenticate, retrieve, record.

## Machine information

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Machine | Meow |
| Difficulty | Beginner (Starting Point, Tier 0) |
| Operating system | Linux |
| Category | Service identification |
| Skills | Port scanning, Telnet, credentialless access |

## Objectives

- Perform a minimal scan and identify exposed services.
- Recognise Telnet and understand its authentication model.
- Attempt a login with the vendor's documented default.
- Retrieve the flag and record the evidence.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Port and service identification |
| `telnet` | Connection |
| `ping` | Connectivity check |

## Initial reconnaissance

Confirm connectivity first:

```bash
ping -c 2 <machine-ip>
```

Starting Point machines are reachable over the HTB VPN. If `ping` fails, the VPN
tunnel is the problem, not the target.

## Enumeration

```bash
nmap -Pn -sV -p- <machine-ip> -oN nmap-meow.txt
```

Expected result: a single open port running Telnet. No web server, no SMB, no SSH.

The instinct to run directory enumeration is wrong here. The scan already answered
the question: this host exposes one interactive service.

```bash
nmap -Pn -sV -p 23 <machine-ip>
```

Confirm the service banner. Telnet sends credentials in clear text and often
supports a default administrative login on appliance-style targets.

## Vulnerability identification

The weakness is configuration, not code:

- Telnet exposed to the network.
- Authentication with a documented default credential.
- No network restriction to a management plane.

Each of these is independently reportable in a real environment. Together they are
a complete compromise path.

## Exploitation

Connect and attempt the platform's documented default login:

```bash
telnet <machine-ip>
```

```text
Trying <machine-ip>...
Connected to <machine-ip>.
Escape character is '^]'.

<device login banner>

login: <default-username>
Password: <default-password>
```

On success you land in a shell or a device CLI. Identify where you are:

```bash
id
uname -a
pwd
ls -la
```

> [!TIP]
> Record the banner. Device banners frequently include the model and firmware
> version, which explains why the default credential worked.

## Privilege escalation

Not required. The default account is already privileged on this appliance-style
host. Confirm rather than assume:

```bash
id
```

If the account is not root, enumerate `sudo -l` and readable files before
theorising.

## Flags and completion evidence

The flag is at the root of the filesystem. It is redacted here.

Record:

- The open port and service banner.
- The account used.
- The privilege level after login.

## Lessons learned

- Identify the service before choosing a tool.
- Default credentials remain a real-world issue on appliances.
- Clear-text protocols are a finding even when authentication is strong.
- A single open port can be the whole attack surface.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Telnet exposed | Replace with SSH; disable Telnet entirely |
| Default credentials | Force a change on first boot |
| Management plane reachable | Restrict to a management network or bastion |
| No monitoring | Alert on first-time logins from new sources |

## References

- Hack The Box — Starting Point: Meow.
- RFC 854 — Telnet protocol.
- CISA — guidance on securing network management interfaces.
