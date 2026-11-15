## The report is the product

A penetration test is judged by its report. Findings that are not reproducible,
impact that is not explained, and remediation that is not actionable all reduce the
value of the work — regardless of how good the testing was.

## Learning objectives

- Structure a professional penetration test report.
- Write findings that engineers can reproduce and fix.
- Communicate risk to non-technical readers.
- Apply CVSS consistently and explain adjustments.

## Prerequisites

- Completed testing with captured evidence.
- A report template.
- The engagement scope document.

## Structure

```text
1. Cover                  — client, dates, classification
2. Executive summary      — 1 page, no jargon
3. Scope and approach     — what was tested, what was not
4. Risk summary           — counts by severity, trend
5. Findings               — one section per finding
6. Remediation roadmap    — prioritised actions
7. Appendices             — tooling, coverage matrix, evidence index
```

## Executive summary

Answer three questions in plain language:

1. How exposed is the organisation today?
2. What are the two or three issues that matter most?
3. What should be done first?

Avoid: vulnerability names without context, severity counts without meaning, and
"the application is insecure".

```text
Two issues require action before the next release. An authorisation flaw allows
any signed-in customer to read other customers' invoices, and an outdated library
allows remote code execution on the public API host. Both are remediable within
the current sprint; the remaining findings are configuration hardening.
```

## Scope and approach

State clearly:

- Hosts, paths and accounts tested.
- Techniques permitted and used.
- What was excluded and why.
- Testing window and any interruptions.
- Limitations: no load testing, no source review, no mobile build available.

Limitations protect both parties. They also explain why a later finding is not a
missed one.

## Finding template

```markdown
## F-02 — Horizontal privilege escalation on invoice downloads

**Severity:** High (CVSS 7.1)
**Affected asset:** https://app.example.com/api/v1/invoices/{id}/download
**Status:** Open

### Description
The endpoint authorises the request by session but does not verify that the
invoice belongs to the caller, allowing any authenticated user to download another
customer's invoice.

### Impact
An attacker with a free account can enumerate invoice identifiers and retrieve
billing addresses, line items and the last four digits of payment cards for all
customers.

### Reproduction
1. Sign in as customer A and download invoice 4821.
2. Capture the request.
3. Sign in as customer B and replay it.
4. Observe a 200 response containing customer A's invoice.

### Evidence
- `evidence/F-02-request.txt`
- `evidence/F-02-response.json`
- `evidence/F-02-screenshot.png`

### Remediation
Scope the query by owner: `WHERE id = ? AND customer_id = ?`, return 404 for
non-owned objects, and add an authorisation test to the endpoint's suite.

### References
- OWASP Top 10 A01
- WSTG-ATHZ-02
```

## Severity and CVSS

| Step | Guidance |
| --- | --- |
| Base score | Score the technical impact |
| Context | Adjust for data sensitivity and exposure |
| Explanation | One sentence per metric that matters |
| Consistency | Same class, same reasoning across findings |

Do not inflate. A report where everything is critical is a report nobody reads
carefully.

## Remediation roadmap

Group actions by effort and risk:

| Priority | Action | Effort | Findings |
| --- | --- | --- | --- |
| 1 | Add ownership checks to invoice endpoints | Low | F-02 |
| 1 | Patch the vulnerable library | Low | F-05 |
| 2 | Restrict CORS to known origins | Low | F-07 |
| 3 | Introduce a coverage gate in CI | Medium | F-09 |

Engineers can act on this table. "Fix all findings" cannot be scheduled.

## Writing style

- Past tense for what was observed, imperative for what to do.
- One idea per paragraph.
- No marketing language.
- Define acronyms on first use.
- Keep sentences under 25 words where possible.

## Quality review

Before delivery:

1. Reproduce every finding from the report alone.
2. Check that every screenshot is redacted.
3. Verify severity consistency.
4. Confirm scope statements match the signed document.
5. Have a second person read the executive summary.

## Common mistakes

- Reporting scanner output without manual verification.
- Missing reproduction steps.
- Severity inflation.
- No limitations section.
- Evidence that includes real customer data.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Writing | Markdown, Word template |
| Severity | CVSS calculator |
| Evidence | Burp exports, redaction tool |
| Diagrams | draw.io |

## Practice lab

1. Write two findings using the template.
2. Score each with CVSS and justify one adjustment.
3. Write a one-page executive summary for a mixed audience.
4. Build a three-priority remediation roadmap.
5. Have a peer reproduce one finding from your write-up alone.

## Further reading

- PTES — reporting guidance.
- OWASP WSTG — reporting.
- FIRST — CVSS v3.1 specification.
