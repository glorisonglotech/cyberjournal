## Scope is a legal document with a technical shape

Programmes describe scope in prose, tables and wildcards. Your job is to convert
that text into a machine-checkable list before any request leaves your machine.

## Learning objectives

- Convert a prose scope into an allow-list you can enforce.
- Distinguish owned, shared and third-party infrastructure.
- Expand a wildcard safely without drifting out of scope.
- Maintain evidence that every tested asset was in scope.

## Prerequisites

- A programme with a written policy.
- A spreadsheet or a plain-text scope file.
- Basic DNS understanding: A, CNAME, NS records.

## Reading the scope text

Typical wording hides three different permissions:

```text
In scope: *.example.com, api.example.com/v1
Out of scope: staging.example.com, any host resolving to third-party SaaS,
              social engineering, physical access
```

Three questions to answer:

1. **Does the wildcard include subdomains of subdomains?** `*.example.com`
   technically matches `a.b.example.com`, but many programmes mean one level.
2. **Is path scoping real?** `api.example.com/v1` scopes a path, not a host; other
   paths on the same host may be out of scope.
3. **What counts as third-party?** A CNAME to a SaaS provider is the usual
   boundary, even if the hostname is on the programme's domain.

When in doubt, ask. A written answer from the programme is the best evidence you
will ever have.

## Build an enforceable allow-list

```text
# scope.txt — one exact host per line, comments allowed
app.example.com
api.example.com
*.eu.example.com   # one level only, per programme confirmation
```

Then filter every discovered host against it:

```bash
grep -E '^(app|api)\.example\.com$|^[a-z0-9-]+\.eu\.example\.com$' hosts.txt > in-scope.txt
```

The important habit: **discovered is not in scope**. Enumeration produces
candidates; scope decides which ones you may touch.

## Verify ownership before testing

A CNAME is the fastest ownership check.

```bash
for host in $(cat in-scope.txt); do
  cname=$(dig +short CNAME "$host" | head -1)
  [ -n "$cname" ] && printf '%s -> %s\n' "$host" "$cname"
done
```

Common CNAME targets that usually mean "not yours to test":

| Target | Meaning |
| --- | --- |
| `*.zendesk.com` | Vendor support portal |
| `*.myshopify.com` | Hosted storefront |
| `*.herokuapp.com` | Customer application on shared PaaS |
| `*.cloudfront.net` | CDN distribution |

A hostname on the programme's domain can still be a vendor's system. Ask before
testing.

## Asset categories worth enumerating

| Category | Examples | Why it matters |
| --- | --- | --- |
| Primary web | `app`, `www` | Main authentication and business logic |
| APIs | `api`, `gateway`, `graphql` | Object-level authorisation |
| Admin | `admin`, `internal`, `dashboard` | Higher privilege, often weaker controls |
| Static | `cdn`, `assets`, `media` | Upload paths, source maps |
| Deprecated | `old`, `legacy`, `v1` | Unpatched code with current data |
| Mobile backends | `m`, `mobile-api` | Version drift from the web app |

## Expanding a wildcard safely

Permutation and brute force are the usual expansion methods, but scope discipline
matters more than technique:

1. Generate candidates from the base list.
2. Resolve them without HTTP requests (DNS is lower impact).
3. Filter against the scope pattern.
4. Only then probe with HTTP.

```bash
# Resolve candidates, keep only in-scope answers
puredns resolve candidates.txt -r resolvers.txt -w resolved.txt
grep -E '(^|\.)example\.com$' resolved.txt > resolved-in-scope.txt
```

If a resolved host is not covered by the scope text, drop it. Do not "test it
gently" — that is still testing.

## Keep provenance

For every asset in your inventory, store:

- Where you found it (CT log, passive DNS, permutation, manual).
- When you found it.
- Which scope clause covers it.
- Whether you have tested it and what you tested.

This is what turns an incident question ("why did you request that host?") into a
one-line answer.

## Common mistakes

- Treating `*.example.com` as permission for every hosting provider under it.
- Forgetting that a path-scoped asset limits which paths you may test.
- Testing a staging host because it was "obviously the same company".
- Losing the scope file between sessions and guessing later.
- Testing through a third-party proxy or CDN cache without checking the policy.

## Toolbox

| Task | Tool |
| --- | --- |
| DNS ownership checks | dig, whois |
| Hosting attribution | Shodan, Censys, ipinfo |
| Scope filtering | grep, awk, small scripts |
| Inventory | spreadsheet or Markdown table |

## Practice lab

1. Take a real programme's scope text and convert it to `scope.txt`.
2. Enumerate hosts, then filter them against your allow-list.
3. Identify every host whose CNAME points at a third party and mark it out of scope.
4. Write the scope clause that justifies each remaining asset.
5. Explain, in two sentences, why one excluded host is excluded.

## Further reading

- HackerOne — programme policy and scope guidance.
- OWASP WSTG — Information gathering.
- RFC 1034 — domain name concepts (for wildcard behaviour).
