## Categories are symptoms

The OWASP Top 10 groups failure modes, not attack techniques. Learning it as a
list of names produces checklists; learning the root cause behind each category
produces fixes.

## Learning objectives

- Explain each 2021 category by its underlying design mistake.
- Identify the control that removes the class rather than the instance.
- Recognise which categories a given finding belongs to.
- Avoid treating the list as a complete testing standard.

## Prerequisites

- Basic web development knowledge.
- One lab application to map examples onto.

## A01 — Broken access control

**Root cause:** the server checks identity but not entitlement. Authorisation is
implemented per-endpoint, inconsistently, often in the UI.

**Typical bug:** `GET /api/invoices/4821` returns another user's invoice.

**Class-level fix:** enforce ownership in the data query, centralise policy checks,
deny by default, test authorisation in CI.

## A02 — Cryptographic failures

**Root cause:** data protected with the wrong primitive, or not at all.

**Typical bugs:** MD5 password hashes, TLS disabled internally, secrets in source.

**Class-level fix:** vetted libraries, Argon2id or bcrypt for passwords, TLS
everywhere, envelope encryption for sensitive fields, key rotation.

## A03 — Injection

**Root cause:** data and code share a channel.

**Typical bugs:** SQL string concatenation, shell interpolation, template injection.

**Class-level fix:** parameterised queries, safe APIs, allow-listed interpreters,
output encoding for the destination context.

## A04 — Insecure design

**Root cause:** the threat model was never written, so the control was never
specified.

**Typical bugs:** password reset with a guessable token, no limit on coupon
redemption, trust in client-side price.

**Class-level fix:** threat modelling per feature, abuse-case tests, secure design
patterns, business-rule validation server-side.

## A05 — Security misconfiguration

**Root cause:** defaults shipped to production.

**Typical bugs:** debug mode on, directory listing, permissive CORS, default
credentials, verbose errors.

**Class-level fix:** hardened baselines, infrastructure as code, automated config
checks, remove unused features, separate environments.

## A06 — Vulnerable and outdated components

**Root cause:** dependency inventory does not exist, so patching is reactive.

**Typical bugs:** an old CMS plugin, an unpatched library with a known RCE.

**Class-level fix:** software bill of materials, automated dependency updates,
patch SLAs by severity, remove unused packages.

## A07 — Identification and authentication failures

**Root cause:** authentication implemented as a form rather than a protocol.

**Typical bugs:** user enumeration, no rate limit, session fixation, weak reset
flows, MFA that can be skipped.

**Class-level fix:** vetted identity provider or library, rate limiting, secure
reset tokens, session rotation, MFA enforced server-side.

## A08 — Software and data integrity failures

**Root cause:** the system trusts artefacts it did not verify.

**Typical bugs:** unsigned updates, insecure deserialisation, CI pipeline without
provenance.

**Class-level fix:** signatures and checksums, trusted registries, dependency
pinning, code review on build configuration.

## A09 — Security logging and monitoring failures

**Root cause:** attacks are invisible, so detection and response never happen.

**Typical bugs:** no logs for authentication failures, no alerting on privilege
changes, logs without context.

**Class-level fix:** structured logs with correlation IDs, detection rules for
high-value events, retention, tested alerting.

## A10 — Server-side request forgery

**Root cause:** the server fetches a user-supplied destination without validation.

**Typical bugs:** image import from URL reaching cloud metadata.

**Class-level fix:** allow-lists, egress controls, no automatic redirects,
metadata service hardening.

## Using the list correctly

| Use it for | Do not use it for |
| --- | --- |
| Structuring a report | Proving coverage |
| Prioritising remediation | Replacing the WSTG |
| Explaining risk to stakeholders | Scoring a specific finding |
| Training developers | Compliance certification |

The Top 10 is awareness material. The WSTG is a test catalogue; ASVS is a
requirements standard. Use all three for different purposes.

## Common mistakes

- Memorising names without the root cause.
- Reporting a finding under several categories to inflate it.
- Assuming a category is covered because a scanner checks it.
- Ignoring A04 and A09 because they are hard to automate.
- Treating the Top 10 as a certification checklist.

## Practice lab

1. For each category, write one example from a lab application.
2. For three categories, write the class-level fix in one sentence.
3. Classify five findings into categories and justify each.
4. Identify which categories a scanner can and cannot detect.
5. Choose the two categories most relevant to a small SaaS product and explain why.

## Further reading

- OWASP Top 10 — 2021 edition.
- OWASP ASVS — application security verification standard.
- OWASP Cheat Sheet Series — per-control implementation guidance.
