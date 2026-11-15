## Why the first list is never enough

Every target has a subdomain list. The interesting hosts are the ones added after
the list was made: a staging environment spun up for a migration, an API for a
mobile release, a vendor portal nobody decommissioned.

Enumeration is therefore a pipeline, not a tool run.

## Learning objectives

- Combine passive, certificate-based and brute-force enumeration.
- Generate permutations that reflect real naming conventions.
- Detect and handle wildcard DNS without losing results.
- Resolve and deduplicate into a single testable list.

## Prerequisites

- subfinder, amass, puredns (or massdns), dnsx.
- A wordlist such as `SecLists/Discovery/DNS/subdomains-top1million-5000.txt`.
- Explicit permission to brute force (check the programme).

## Layer 1 — Passive sources

```bash
subfinder -d example.com -all -silent > passive.txt
amass enum -passive -d example.com -o amass.txt
```

Certificate transparency adds hosts that were never published:

```bash
curl -s "https://crt.sh/?q=%25.example.com&output=json" \
  | jq -r '.[].name_value' | tr ',' '\n' | sed 's/^\*\.//' | sort -u > ct.txt
```

Merge:

```bash
sort -u passive.txt amass.txt ct.txt > base.txt
```

## Layer 2 — Permutations

Naming conventions are predictable. If `api.example.com` exists, then
`api-dev`, `api-staging`, `api.internal` and `api-v2` are worth checking.

```bash
# Common environment and role tokens
for host in $(cat base.txt); do
  label=$(echo "$host" | sed 's/\.example\.com$//')
  for token in dev staging stage uat qa test prod old new v2 beta admin internal; do
    echo "${label}-${token}.example.com"
    echo "${token}-${label}.example.com"
  done
done | sort -u > permutations.txt
```

This grows fast. A 500-host base becomes 10,000 candidates; resolve before
probing, and keep the base list so you can explain where a host came from.

## Layer 3 — Brute force

Brute force is the only layer that needs permission. Use a resolver that handles
volume and rate limits.

```bash
# Sanity check the resolvers first
puredns resolve brute-candidates.txt -r resolvers.txt -w resolved-brute.txt
```

A realistic workflow:

```bash
head -n 20000 subdomains-top1million-5000.txt \
  | sed 's/$/.example.com/' > brute-candidates.txt

puredns resolve brute-candidates.txt \
  -r resolvers.txt \
  --rate-limit 200 \
  -w resolved-brute.txt
```

Rate limiting yourself is not politeness; it keeps the programme's DNS from
looking like it is under attack.

## Wildcard DNS

A wildcard record answers every name, which produces thousands of false results.
Detect it before trusting brute force output.

```bash
dig +short "random-$RANDOM-sub.example.com" A
```

If that returns an address, the zone has a wildcard. Compare candidate answers
against the wildcard address and drop matches. `puredns` does this automatically;
with other tools, filter manually:

```bash
wildcard_ip=$(dig +short "random-987654.example.com" A | head -1)
grep -v "$wildcard_ip" resolved-raw.txt > resolved.txt
```

## Resolution and HTTP probing

```bash
dnsx -l all-candidates.txt -a -resp -silent -o resolved.txt
httpx -l <(awk '{print $1}' resolved.txt) -silent \
  -status-code -title -tech-detect -web-server -o live.txt
```

The `live.txt` file is the deliverable. Everything before it was candidate
generation; this is the list you test.

## Deduplicate by content, not name

Two hostnames frequently serve the same application, and the same application
often answers on several ports. Group by title and favicon hash to avoid testing
the same code five times.

```bash
awk '{print $NF, $0}' live.txt | sort | awk '!seen[$1]++'
```

## Common mistakes

- Brute forcing before checking whether the policy allows it.
- Ignoring wildcard DNS and then testing 4,000 identical 200 responses.
- Losing provenance: you find `admin.example.com` but cannot tell whether it came
  from CT logs or your own permutation list.
- Forgetting non-HTTP services. A resolved host with no website may still run
  SSH, VPN or a database.
- Not re-running the pipeline after a few weeks.

## Toolbox

| Task | Tool |
| --- | --- |
| Passive enumeration | subfinder, amass |
| Certificate transparency | crt.sh, certspotter |
| High-volume resolution | puredns, massdns |
| DNS details | dnsx, dig |
| HTTP probing | httpx |

## Practice lab

1. Enumerate `example.com` (a domain you own) with passive sources only.
2. Generate permutations and resolve them with a low rate limit.
3. Detect whether the zone has a wildcard record and filter accordingly.
4. Produce a live-host list with status, title and technology.
5. Pick three hosts with unusual titles and write a hypothesis for each.

## Further reading

- OWASP WSTG — Enumerate applications on the web server.
- Project Discovery — subfinder, dnsx, httpx documentation.
- Certificate transparency — RFC 6962 overview.
