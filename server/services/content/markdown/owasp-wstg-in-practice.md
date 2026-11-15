## A checklist is not a strategy

The OWASP Web Security Testing Guide is a catalogue of test cases with stable
identifiers. Its value is coverage: you can point at `WSTG-ATHZ-02` and say what
you tested, what you found, and what you did not.

## Learning objectives

- Navigate the WSTG structure and identifiers.
- Turn test cases into a coverage matrix for an engagement.
- Record negative results so coverage is defensible.
- Map findings back to WSTG categories in a report.

## Prerequisites

- The WSTG document (web or PDF).
- A spreadsheet.
- A target and scope.

## Structure

The guide is organised by category:

| Code | Category |
| --- | --- |
| INFO | Information gathering |
| CONF | Configuration and deployment |
| IDNT | Identity management |
| ATHN | Authentication |
| ATHZ | Authorisation |
| SESS | Session management |
| INPV | Input validation |
| ERRH | Error handling |
| CRYP | Cryptography |
| BUSL | Business logic |
| CLNT | Client-side testing |
| APIT | API testing |

Each test has a code, an objective, and how-to-test guidance. Use the objective,
not the steps: the steps assume a generic application.

## Building a coverage matrix

```text
WSTG ID       Test                                  Applicable  Status   Finding
INFO-01       Conduct search engine discovery        yes         done     -
INFO-05       Review webpage content                 yes         done     F-03
CONF-01       Test network infrastructure            partial     done     -
ATHN-01       Test credentials over encrypted chan.  yes         done     -
ATHN-04       Test for bypassing authentication      yes         done     F-01
ATHZ-01       Test directory traversal               yes         done     -
ATHZ-02       Test bypassing authorization schema    yes         done     F-02
SESS-02       Test cookie attributes                 yes         done     -
INPV-05       Test for SQL injection                 yes         done     -
CLNT-01       Test DOM-based XSS                     yes         done     -
BUSL-01       Test business logic data validation    partial     done     -
```

Three columns carry the weight: **Applicable**, **Status**, **Finding**. A test
that does not apply should say why in a notes column.

## Prioritising within the matrix

Not every test deserves equal time. Weight by:

1. **Attack surface** — endpoints exposed without authentication.
2. **Data sensitivity** — anything with PII, payments or credentials.
3. **Historical risk** — access control and authentication fail most often.
4. **Change velocity** — recently shipped features are less tested.

A realistic pass covers INFO, CONF, ATHN, ATHZ, SESS, INPV and BUSL thoroughly and
samples CRYP, ERRH and CLNT based on exposure.

## Recording negative results

A report that says "no authorisation issues found" is weaker than:

> WSTG-ATHZ-02 tested across 14 endpoints with three roles; horizontal access
> enforced with 403/404 responses on all object endpoints; no vertical escalation
> observed from the `member` role.

The second version is verifiable and shows method.

## Using the guide during testing

- Open the relevant test page when you start a category.
- Rewrite each objective as a hypothesis on your target.
- Record the exact request that answered it.
- Note the WSTG code beside the finding for the report.

Do not follow the guide's example payloads literally. They are demonstrations,
not a test plan for your application.

## Mapping findings for the report

```text
F-02 — Horizontal privilege escalation on invoices
WSTG: ATHZ-02, ATHZ-04
OWASP Top 10: A01 Broken Access Control
CVSS: AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N (7.1 High)
```

The mapping helps the client's remediation tracking and gives your report a
structure reviewers recognise.

## Common mistakes

- Treating the checklist as complete coverage when half the tests were skipped.
- Applying tests that do not fit the technology (LDAP tests on a JWT-only API).
- Reporting the WSTG code instead of the impact.
- Skipping authenticated testing because credentials were not provided.
- Not recording negative results.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Test catalogue | OWASP WSTG |
| Coverage tracking | spreadsheet |
| Request capture | Burp Suite |
| Severity mapping | CVSS, OWASP Top 10 |

## Practice lab

1. Build a matrix of 15 WSTG tests relevant to a lab application.
2. Mark applicability and justify exclusions.
3. Execute five tests and record requests for each.
4. Write one positive and one negative result in report language.
5. Map the positive finding to WSTG, Top 10 and CVSS.

## Further reading

- OWASP Web Security Testing Guide.
- OWASP Top 10 (2021).
- OWASP ASVS — verification requirements.
