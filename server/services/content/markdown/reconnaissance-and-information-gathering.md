## Recon is inventory work

Reconnaissance has one deliverable: a list of assets you understand well enough
to test. Screenshots are not an inventory. A folder of tool output is not an
inventory. An inventory has an owner, a purpose, a technology and a status for
every entry.

## Learning objectives

- Separate passive from active reconnaissance and know when each is allowed.
- Enumerate domains, hosts, certificates and technologies without touching the
  target directly.
- Produce a deduplicated asset inventory with enough context to prioritise.
- Recognise when a discovered host is out of scope.

## Prerequisites

- `dig`, `whois`, `curl`.
- subfinder and amass installed.
- A notes file per target.

## Passive first

Passive sources never send traffic to the target. They are safe, fast, and often
reveal more than brute force.

### Certificate transparency

Every publicly trusted certificate is logged. Certificate transparency logs
therefore leak hostnames that were never linked anywhere.

```bash
# Query crt.sh for a domain, unique names only
curl -s "https://crt.sh/?q=%25.example.com&output=json" \
  | jq -r '.[].name_value' \
  | tr ',' '\n' \
  | sed 's/^\*\.//' \
  | sort -u > ct-hosts.txt
```

### Passive DNS and subdomain sources

```bash
subfinder -d example.com -all -silent | sort -u > passive-hosts.txt
amass enum -passive -d example.com -o amass-passive.txt
```

Merge and deduplicate:

```bash
cat ct-hosts.txt passive-hosts.txt amass-passive.txt \
  | sed 's/^[[:space:]]*//' \
  | grep -E '^[a-z0-9.-]+$' \
  | sort -u > hosts.txt
wc -l hosts.txt
```

### Ownership and hosting

Before testing, know who runs the host. A CNAME to a SaaS provider usually means
the programme does not own the infrastructure.

```bash
while read -r host; do
  printf '%-40s ' "$host"
  dig +short CNAME "$host" | head -1
done < hosts.txt
```

## Active reconnaissance

Active means you send packets to the target. Check the programme's rules first;
some allow it with rate limits, some require prior notice.

### Resolve and probe

```bash
# Resolve only the hosts that still exist
dnsx -l hosts.txt -a -resp -silent > resolved.txt

# Probe HTTP(S), capture status, title and server
httpx -l hosts.txt -silent -status-code -title -tech-detect -web-server \
  -o httpx.txt
```

`httpx` output is the first real inventory. Read it rather than grepping it:
a 403 with a login title is a different target from a 200 marketing page.

### Technology fingerprinting

```bash
whatweb -i httpx.txt --log-brief=whatweb.txt
```

Record the framework, the auth provider and the CDN. Framework choice predicts
routing behaviour, error pages and default endpoints.

## Turning output into an inventory

Use a table with fixed columns so you can sort and filter:

| Host | Status | Title | Stack | Auth | Notes |
| --- | --- | --- | --- | --- | --- |
| app.example.com | 200 | Sign in | Next.js, Auth0 | OIDC | Main app |
| api.example.com | 401 | — | Express | Bearer | Documented API |
| legacy.example.com | 200 | Admin | PHP 5.6 | Basic | Old, likely forgotten |

The "Notes" column is where recon becomes testing. "Old, likely forgotten" is a
hypothesis. "Main app" is a place to spend time only after the edges are covered.

## Prioritisation

Test in this order unless the programme says otherwise:

1. **Forgotten hosts** — old admin panels, staging environments, deprecated APIs.
2. **Authentication edges** — registration, reset, invite, SSO callbacks.
3. **API surfaces** — documented and undocumented, especially versioned paths.
4. **File handling** — upload, import, export, PDF generation.
5. **The main application** — highest competition, so bring a specific hypothesis.

> [!TIP]
> A host that returns 403 to your browser is not closed. Try a different Host
> header, a path from the sitemap, or the same host over HTTP. Access control at
> the edge is often path-specific.

## Scope discipline

Three checks before any active request:

1. Does the hostname match an in-scope pattern exactly?
2. Does the resolved IP belong to the programme, or to a third party?
3. Does the policy allow the technique (brute force, scanning, exploitation)?

If any answer is unclear, ask. Recon generates enough leads that you never need
to gamble on scope.

## Common mistakes

- Treating a wildcard as blanket permission.
- Testing a host that resolves to a shared SaaS tenant.
- Losing the source of a hostname, so you cannot tell whether it is in scope.
- Running brute force before passive sources are exhausted.
- Forgetting to re-run recon monthly; new certificates appear constantly.

## Toolbox

| Task | Tool |
| --- | --- |
| Certificate transparency | crt.sh, certspotter |
| Passive subdomains | subfinder, amass passive |
| DNS resolution | dnsx, dig |
| HTTP probing | httpx |
| Fingerprinting | whatweb, wappalyzer |
| Screenshots | aquatone, gowitness |

## Practice lab

1. Pick a domain you own or a programme that permits passive recon.
2. Collect hosts from certificate transparency and two passive sources.
3. Resolve and probe them, then build the inventory table.
4. Mark each host in scope or out of scope with a one-line justification.
5. Choose the three hosts you would test first and write a hypothesis for each.

## Further reading

- OWASP WSTG — Information Gathering section.
- Project Discovery documentation for subfinder, dnsx and httpx.
- The Bug Bounty Hunter's Methodology (Jason Haddix) — recon phases.
- RFC 8555 and certificate transparency documentation for how CT logs work.
