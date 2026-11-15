## Scan with a question

A port scan without a purpose produces a list. A scan with a purpose produces an
attack plan: which services are exposed, which versions are running, and which of
them are worth a second request.

## Learning objectives

- Choose scan types appropriate to the network and the rules of engagement.
- Detect versions and identify services with confidence.
- Use NSE scripts safely and selectively.
- Build a service inventory that feeds later testing.

## Prerequisites

- nmap installed.
- Authorisation to scan the target network.
- A notes file per host.

## Step 1 — Host discovery

On a local network, ARP is reliable. Across the internet, assume hosts block ICMP.

```bash
# Local lab: ARP discovery
nmap -sn 10.10.10.0/24 -oG hosts.txt

# Remote: skip discovery, treat the host as up
nmap -Pn -p 80,443 target.example
```

## Step 2 — Port selection

| Approach | Command | Use when |
| --- | --- | --- |
| Top 1000 | `nmap target` | Quick first look |
| All TCP | `nmap -p- target` | Thorough, slow |
| Common + version | `nmap -sV -p 1-10000 target` | Balance |
| UDP top 50 | `nmap -sU --top-ports 50 target` | DNS, SNMP, NTP |

```bash
nmap -Pn -p- --min-rate 1000 -oA full-tcp target.example
```

`-oA` writes normal, XML and grepable output. Keep them; the XML is what other
tools consume.

## Step 3 — Service and version detection

```bash
nmap -Pn -sV -sC -p 22,80,445,3306 target.example
```

`-sV` probes for banners and behaviour. Treat the version as a hypothesis: banner
grabbing can be fooled by proxies and hardened configurations.

Confirm manually:

```bash
curl -sI http://target.example/ | head -20
ssh -oBatchMode=yes target.example 2>&1 | head -3
```

## Step 4 — Scripts, used selectively

The NSE library is large. Use categories rather than everything:

```bash
nmap -Pn -sV --script "http-title,http-headers,http-methods" -p 80,443 target.example
nmap -Pn -sV --script smb-os-discovery,smb-enum-shares -p 445 target.example
```

Avoid `--script vuln` on production targets: it can be disruptive and noisy, and
many programmes forbid it. If a script exploits rather than enumerates, ask first.

## Step 5 — Reading results as service classes

| Service | What it implies |
| --- | --- |
| 22 SSH | Credentials, keys, weak algorithms |
| 80/443 | Web application, vhosts |
| 445 SMB | Shares, null sessions, signing |
| 3306 MySQL | Exposure, weak credentials |
| 6379 Redis | Often unauthenticated |
| 8080/8443 | Admin panels, alt web |

Each maps to an enumeration path. A 445 open on a Linux box is more interesting
than a 445 open on a domain controller, because it suggests Samba with default
configuration.

## Step 6 — TLS and certificates

```bash
nmap -Pn -p 443 --script ssl-cert,ssl-enum-ciphers target.example
```

Certificate subject alternative names frequently reveal additional hostnames.
Add them to scope checks before testing.

## Step 7 — Produce the inventory

```text
host            port  service  version              notes
10.10.10.5      22    ssh      OpenSSH 8.2p1        password auth enabled
10.10.10.5      80    http     nginx 1.18           redirects to https
10.10.10.5      443   https    nginx 1.18           cert: app, api, admin
10.10.10.5      3306  mysql    5.7.33               exposed, not tested
```

The notes column is what turns a scan into a plan.

## Common mistakes

- Running `-p-` with default timing against a rate-limited scope.
- Trusting `-sV` output without manual confirmation.
- Using intrusive scripts without permission.
- Ignoring UDP: DNS and SNMP are common weak points.
- Forgetting to record the scan time; services change.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Scanning | nmap |
| Manual service checks | curl, ssh, nc |
| TLS review | testssl.sh, ssl-enum-ciphers |
| Output processing | nmap XML + `xmllint` |

## Practice lab

1. Run a top-1000 scan against a lab host and record open ports.
2. Run a full TCP scan and compare results.
3. Identify versions for two services and confirm one manually.
4. Run a TLS enumeration and list certificate SANs.
5. Build the inventory table with a next-step note per service.

## Further reading

- Nmap Network Scanning (Gordon Lyon).
- Nmap NSE documentation.
- OWASP WSTG — Network infrastructure configuration testing.
