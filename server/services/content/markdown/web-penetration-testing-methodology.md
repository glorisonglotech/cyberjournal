## A method survives time pressure

Pentests fail in predictable ways: scope creep, untested areas, and findings that
cannot be reproduced in the report. A written method prevents all three.

## Learning objectives

- Run an engagement through defined phases.
- Allocate time by risk instead of by curiosity.
- Keep evidence that supports the report.
- Know when to stop testing and start writing.

## Prerequisites

- Signed authorisation and a scope document.
- Burp Suite, nmap and a notes system.
- A report template.

## Phase 0 — Scoping

Before any packet:

| Question | Why |
| --- | --- |
| Which hosts and paths? | Legal boundary |
| Which techniques are allowed? | Some clients forbid DoS or social engineering |
| Which accounts are provided? | Role coverage |
| Is production or staging? | Data handling |
| Who is the emergency contact? | Stop conditions |
| What are the testing windows? | Avoid peak traffic |

Write the answers down. "The client said it was fine" is not evidence.

## Phase 1 — Reconnaissance

Deliverable: an asset inventory with technology and authentication notes.

- Passive discovery (certificates, DNS, public code).
- Active probing (status, titles, tech stack).
- Authentication surface mapping.

Time: 10–15% of the engagement.

## Phase 2 — Mapping

Deliverable: a route map and a role matrix.

- Browse every feature with the proxy on.
- Record API calls and versions.
- Identify all roles and their intended capabilities.
- Note third-party integrations.

Time: 15%.

## Phase 3 — Testing

Work through classes in a fixed order so coverage is provable:

1. Authentication and session management.
2. Access control (horizontal, vertical, tenant).
3. Injection (SQL, command, template, LDAP).
4. Client-side (XSS, CSRF, postMessage, CORS).
5. Server-side request handling (SSRF, uploads, deserialisation).
6. Business logic and race conditions.
7. Configuration and information disclosure.

For each class: test the highest-value endpoints first, record negative results,
and stop when the marginal return drops.

Time: 45–55%.

## Phase 4 — Exploitation and impact

For each confirmed finding, answer:

- What can an attacker do?
- Which precondition is required?
- How many users or records are affected?
- What is the business consequence?

Stop at proof. Do not pivot through production systems, do not modify data beyond
your own accounts, and do not establish persistence.

Time: 10%.

## Phase 5 — Reporting

Write while testing, not after. Each finding note should contain the request,
response, impact and fix as soon as it is confirmed.

Time: 15–20%, including review.

## Phase 6 — Retest

After remediation, verify the specific finding and one adjacent variation. A patch
that blocks one payload is not a fix.

## Time boxing

A practical allocation for a five-day application test:

| Day | Focus |
| --- | --- |
| 1 | Scoping, recon, mapping, authentication |
| 2 | Access control and session management |
| 3 | Injection and server-side classes |
| 4 | Client-side, business logic, configuration |
| 5 | Confirmation, report writing, review |

Adjust for application size, not for how interesting a single bug is.

## Coverage tracking

Use a matrix:

| Area | Tested | Findings | Notes |
| --- | --- | --- | --- |
| Login | yes | 1 | enumeration via reset |
| Admin panel | yes | 0 | role checks enforced |
| File upload | partial | 0 | blocked at edge |

Negative results are part of the report. They tell the client what was covered.

## Evidence discipline

- Timestamp every note.
- Save raw requests, not screenshots of them.
- Redact secrets as you go, not at the end.
- Keep a chain-of-custody note for any data viewed.
- Use one naming convention: `F-01-idor-invoices.md`.

## Common mistakes

- Testing without written scope.
- Spending day one on the first interesting endpoint.
- Forgetting authenticated areas because the login was slow.
- Reporting without reproduction steps.
- Retesting only the exact payload from the report.

## Toolbox

| Phase | Tools |
| --- | --- |
| Recon | subfinder, httpx, whatweb, nmap |
| Mapping | Burp Suite, browser DevTools |
| Testing | Burp Suite, ffuf, sqlmap, custom scripts |
| Evidence | Markdown, curl, screen recorder |
| Reporting | report template, CVSS calculator |

## Practice lab

1. Write a scope document for a lab application.
2. Run phases 1–2 and produce an inventory and role matrix.
3. Test one class per phase-3 category and record results.
4. Write two findings in the report template.
5. Perform a peer review of the coverage matrix.

## Further reading

- OWASP WSTG — testing framework.
- PTES — penetration testing execution standard.
- OWASP ASVS — verification requirements for remediation advice.
