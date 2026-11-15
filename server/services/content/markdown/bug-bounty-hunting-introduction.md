## Why most beginners stall

Bug bounty hunting looks like a shortcut into security work. In practice it is a
market: thousands of testers look at the same endpoints, and the ones who earn
are usually the ones who understand one application deeply rather than fifty
applications superficially.

The failure pattern is predictable. A new hunter picks the largest programme,
runs a subdomain tool, opens fifty hosts, finds nothing in an hour, and concludes
they need more tools. The actual gap is usually method: no asset inventory, no
notes, no hypothesis, no proof.

> [!NOTE]
> Everything in this tutorial is for authorised testing. A programme's scope page
> is the only permission you have. Reading it is step zero, not paperwork.

## Learning objectives

By the end of this tutorial you should be able to:

- Choose a programme that matches your current skill level.
- Build a small, tracked asset inventory instead of a bookmark folder.
- Run a repeatable testing loop on one target for a fixed time box.
- Decide when a finding is ready to report.

## Prerequisites

- Comfort with HTTP basics: methods, status codes, cookies, headers.
- A working Burp Suite Community installation and a browser configured to proxy through it.
- Basic Linux command line: `curl`, `grep`, `sort`, `awk`.
- An account on one platform (HackerOne, Bugcrowd or Intigriti).

## Step 1 — Pick a programme you can actually finish

Three filters matter more than payout size:

| Filter | What to look for | Why |
| --- | --- | --- |
| Scope size | 5–40 assets, not 4,000 | You can enumerate it completely |
| Response time | Under 14 days average | Feedback keeps you learning |
| Technology | Something you have used | You recognise framework behaviour |

A programme with a $500 maximum and a two-day triage time will teach you more in
a month than a $10,000 programme that never replies.

Avoid, for now: programmes whose scope is "all subdomains of a global brand",
programmes with no disclosed reports, and programmes that forbid automated
scanning if automation is the only technique you have.

## Step 2 — Read the scope like a contract

Write the scope into a table before touching a tool. Include the exact hostname,
the asset type, and any explicit exclusions.

```text
asset                          type      in scope   notes
app.example.com                web       yes        main application
api.example.com                api       yes        documented in /docs
*.dev.example.com              web       no         excluded explicitly
status.example.com             web       no         third party
```

Two rules that prevent most bans:

1. **A wildcard is not permission to attack third-party infrastructure.** A
   `*.example.com` host that resolves to a Shopify or Zendesk instance is usually
   out of scope by the programme's own wording.
2. **Do not test what you cannot attribute.** If you cannot explain who owns the
   host, ask the programme before testing it.

## Step 3 — Build an inventory, not a screenshot folder

For each in-scope host, record five things:

- Resolved IP and hosting provider.
- HTTP status, title and server header.
- Technology hints (framework, CMS, auth provider).
- Authentication surface (login, registration, password reset, API tokens).
- One sentence on what the application is for.

A spreadsheet is enough. The point is that after two hours you can answer "what
have I looked at?" without reopening forty tabs.

```bash
# A minimal inventory pass
while read -r host; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 "https://$host")
  title=$(curl -s -m 10 "https://$host" | grep -o '<title>[^<]*' | head -1 | cut -c8-)
  printf '%s\t%s\t%s\n' "$host" "$code" "$title"
done < hosts.txt | tee inventory.tsv
```

## Step 4 — Work one hypothesis at a time

A hypothesis is a sentence you can disprove:

- "The invoice download endpoint authorises by object ID only."
- "The password reset token is not bound to the account."
- "The API returns other tenants' records when the tenant header is changed."

Then run the smallest request that tests it. This is the difference between
testing and clicking. A time box of 45 minutes per hypothesis keeps you honest:
if it is not confirmed, write down why and move on.

> [!TIP]
> Keep a `notes.md` per target with a timestamped log. When a finding appears
> three hours later, you will not remember which account, which request, or which
> header produced it.

## Step 5 — Know when you have a finding

A reportable finding has four properties:

1. **Reproducible** from a clean session with the steps you wrote.
2. **In scope** according to the programme text.
3. **Consequential** — it crosses a trust boundary, exposes data, or changes state.
4. **Evidenced** with the request, the response, and the observable difference.

If any of the four is missing, you have a lead, not a finding. Leads are still
valuable: they are what you return to when you understand the application better.

## A six-month plan that works

| Month | Focus | Output |
| --- | --- | --- |
| 1 | HTTP, Burp, one small programme | 10 documented hypotheses |
| 2 | Access control and authentication | First valid report |
| 3 | Recon and content discovery | Complete inventory of one target |
| 4 | Injection classes in labs | 20 lab solves with notes |
| 5 | API testing | One API-focused report |
| 6 | Report quality and follow-up | Re-triage feedback, refine |

The output column matters more than the month. Hunting without artefacts is
practice without feedback.

## Common mistakes

- **Tool-first testing.** Running `nuclei` against a scope you have not read
  produces noise and, occasionally, a ban.
- **Reporting theoretical impact.** "An attacker could potentially..." is the
  fastest route to an informational rating. Show the actual response.
- **Ignoring duplicates.** Before deep-diving a well-known endpoint, check
  disclosed reports for the same programme.
- **Testing production data.** Use your own accounts. Never modify another
  user's data to prove a point.
- **No notes.** The finding you cannot reproduce is the finding you cannot report.

## Toolbox

| Purpose | Tool | Note |
| --- | --- | --- |
| Interception | Burp Suite Community | Free, sufficient for manual work |
| Subdomains | subfinder, amass | Passive first |
| Content discovery | ffuf, feroxbuster | Rate-limit yourself |
| HTTP client | curl | Reproducible evidence |
| Notes | Markdown + screenshots | Timestamp everything |

## Practice lab

1. Create a free HackerOne or Bugcrowd account and read three programme briefs.
2. For each, write the scope table from Step 2 without opening any tool.
3. Pick the smallest programme and inventory every in-scope host.
4. Write five hypotheses about the main application. Test one.
5. Publish nothing; instead, write a one-page internal report as if you were
   submitting it, and check it against the four properties above.

## Further reading

- OWASP Web Security Testing Guide — testing framework and per-class checklists.
- PortSwigger Web Security Academy — free labs for every class referenced here.
- HackerOne Hacktivity — disclosed reports, useful for understanding triage norms.
- The Bug Bounty Hunter's Methodology by Jason Haddix — recon structure.
