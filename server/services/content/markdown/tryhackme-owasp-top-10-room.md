> [!NOTE]
> **Room notes.** Answers and values from the live room are redacted; command
> output is illustrative. The room is most useful when you predict the failure
> before reading the explanation.

## Executive summary

The OWASP Top 10 room walks through one lab per failure class. Followed passively
it is a quiz. Used properly it is a diagnostic exercise: for each lab, identify the
input you control, the trust boundary it crosses, and the control that is missing.

This write-up records the reasoning pattern for each lab rather than the answer
strings.

## Room information

| Field | Value |
| --- | --- |
| Platform | TryHackMe |
| Room | OWASP Top 10 |
| Difficulty | Intermediate |
| Operating system | Web |
| Category | Web security |
| Skills | Injection, access control, cryptographic failures, logging |

## Objectives

- Recognise each Top 10 category from behaviour, not from its name.
- Identify the trust boundary a payload crosses.
- Explain the class-level fix for each lab.
- Build a mapping between a symptom and a category.

## Tools used

| Tool | Purpose |
| --- | --- |
| Burp Suite | Request interception and replay |
| Browser DevTools | Client-side inspection |
| curl | Reproducible requests |
| CyberChef | Encoding and decoding |

## Initial reconnaissance

Before touching a lab, enumerate the application:

```bash
curl -s http://<room-ip>/ | head -40
curl -s http://<room-ip>/robots.txt
```

Then browse with the proxy on. For each lab, note the endpoints and the parameters
you can influence. The room deliberately keeps the surface small; in a real
application this step is the bulk of the work.

## Enumeration and per-lab reasoning

### A01 Broken access control

Look for an identifier that names data rather than a permission. Change it and
observe whether the server re-checks ownership.

Test pattern:

```http
GET /api/user?id=2 HTTP/1.1
Cookie: session=<your-session>
```

If the response returns another user's data, the check is missing at the object
level. The fix is a scoped query, not a hidden button.

### A02 Cryptographic failures

Look for data that is protected with the wrong tool: a hash where encryption is
needed, a weak algorithm, or a secret stored client-side.

Test pattern: inspect cookies and local storage for encoded values, then decode:

```bash
echo '<value>' | base64 -d
```

If decoded content reveals a credential or a predictable token, the protection is
encoding rather than cryptography.

### A03 Injection

Identify the interpreter (SQL, shell, template) from the error and the context.
Then confirm with a boolean or timing difference before extracting anything.

### A04 Insecure design

The lab rewards reading the business rule. Ask what the workflow assumes and where
that assumption is enforced. Client-side validation is a hint that the server
trusts the client.

### A05 Security misconfiguration

Check defaults: directory listing, debug pages, verbose errors, exposed admin
interfaces. The room usually exposes one obvious surface; the lesson is to look
for it systematically.

### A06 Vulnerable components

Identify the component and its version, then check whether the version is actually
affected. A banner is not a vulnerability.

### A07 Identification and authentication failures

Exercise the reset and login flows. Compare responses for known and unknown users.
Look for weak session handling and missing limits.

### A08 Software and data integrity failures

Look at how the application consumes artefacts: updates, serialised objects,
uploaded files. If it trusts content it did not verify, the lab demonstrates the
consequence.

### A09 Logging and monitoring failures

This lab is conceptual: identify which events would be invisible to a defender.
Useful practice for writing detections later.

### A10 SSRF

Find the URL-accepting parameter, confirm out-of-band, then map what the server can
reach. Stop at proof.

## Vulnerability identification

For each lab, write three lines:

```text
input:      the parameter you control
boundary:   what the input should never reach
control:    what is missing (ownership check, encoding, allow-list)
```

If you cannot fill all three, you have found a symptom rather than understood a
class.

## Exploitation

Exploitation in this room is guided. The transferable skill is the confirmation
step: a boolean difference, a status change, or a callback — not a lucky payload.

## Privilege escalation

Not applicable to most labs. Where a lab involves an admin interface, the relevant
question is whether the privilege check is enforced server-side.

## Flags and completion evidence

Answers are redacted. Record the request that produced each answer and the response
field that proves it.

## Lessons learned

- Categories describe root causes, not payloads.
- Access control and authentication cause most real breaches.
- Logging failures make every other failure worse.
- A version banner needs a matching advisory before it is a finding.

## Mitigation and remediation

| Category | Control |
| --- | --- |
| A01 | Server-side ownership checks, deny by default |
| A02 | Vetted crypto libraries, proper key management |
| A03 | Parameterisation and output encoding |
| A04 | Threat modelling and abuse-case tests |
| A05 | Hardened baselines, no debug in production |
| A06 | Dependency inventory and patch SLAs |
| A07 | Rate limits, secure reset flows, session rotation |
| A08 | Signature verification and integrity checks |
| A09 | Structured logging and alerting |
| A10 | Destination allow-lists and egress controls |

## References

- OWASP Top 10 (2021).
- TryHackMe — OWASP Top 10 room.
- OWASP Cheat Sheet Series.
