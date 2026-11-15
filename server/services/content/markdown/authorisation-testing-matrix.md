## Coverage you can prove

Authorisation bugs hide in the endpoints nobody tested. A role matrix turns "I
looked around" into "these 40 actions were tested with these 4 roles".

## Learning objectives

- Build a role-by-action matrix from the application's own model.
- Test horizontal, vertical and tenant boundaries systematically.
- Record results in a form that supports the report.
- Identify where authorisation is enforced and where it is assumed.

## Prerequisites

- Accounts for every role, including two in different tenants if available.
- Burp Suite with Autorize or a manual process.
- The application's feature list.

## Step 1 — Enumerate roles

Sources: the UI, invitation screens, documentation, API responses (`role` fields),
and error messages.

```text
roles: viewer, member, manager, admin, owner
```

If roles are dynamic (custom permissions), test the permission toggles instead:
a role is a bundle of capabilities.

## Step 2 — Enumerate actions

List every state-changing action and every data read:

| Area | Actions |
| --- | --- |
| Users | list, view, invite, edit, deactivate, delete |
| Billing | view invoices, change plan, add card, download receipts |
| Projects | create, view, edit, archive, delete, share |
| Settings | read, update, API keys, webhooks |
| Exports | CSV, PDF, bulk download |

Include actions that exist only in the API (mobile endpoints, internal tools).

## Step 3 — Build the matrix

```text
action                  viewer  member  manager  admin  other-tenant
list users              deny    deny    allow    allow  deny
view user detail        self    self    allow    allow  deny
invite user             deny    deny    allow    allow  deny
change plan             deny    deny    deny     allow  deny
download invoice        own     own     own      all    deny
create API key          deny    self    self     self   deny
```

Fill the "expected" column first, then test.

## Step 4 — Test each cell

For a denied action, use the lowest-privilege token and record the response:

```bash
curl -s -o body.json -w '%{http_code}\n' \
  -H "Authorization: Bearer $VIEWER" \
  https://target.example/api/users
```

For a self-only action, substitute another user's identifier with your token.

For tenant boundaries, substitute the tenant identifier:

```http
GET /api/projects/9912 HTTP/1.1
X-Tenant-Id: other-tenant-uuid
Authorization: Bearer <your-token>
```

## Step 5 — Automate the repetition, not the judgement

Autorize replays every proxied request with a lower-privilege session and flags
responses that look successful.

```text
1. Configure the higher-privilege session as the "original".
2. Configure the lower-privilege session as the "replacement".
3. Browse the application as the higher-privilege user.
4. Review flagged requests: a 200 with body content is a candidate.
```

Autorize produces candidates. Verify each one manually; response-length heuristics
generate false positives.

## Step 6 — Where enforcement usually fails

| Pattern | Failure |
| --- | --- |
| UI hides the button | API still allows the action |
| Check on the collection | Object endpoint unprotected |
| Check in the controller | GraphQL resolver or batch endpoint bypasses |
| Check on the web API | Mobile API uses older middleware |
| Check the user ID | Tenant ID not verified |
| Check at the edge | Internal service trusts its caller |

## Step 7 — Record results

```text
AUTHZ-01  viewer -> GET /api/users             403  pass
AUTHZ-02  viewer -> GET /api/users/42          200  FAIL (PII exposed)
AUTHZ-03  member -> POST /api/invites          403  pass
AUTHZ-04  tenantA -> GET /api/projects/9912    200  FAIL (cross-tenant)
```

Four lines of matrix become four report statements, two of them findings.

## Common mistakes

- Testing only UI-reachable endpoints.
- Using one account and inferring role behaviour.
- Missing GraphQL and batch endpoints.
- Forgetting exports and file downloads.
- Automating without verifying; heuristics produce noise.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Request capture | Burp Suite |
| Automated replay | Autorize |
| API testing | Postman, curl |
| Matrix | spreadsheet |

## Practice lab

1. Enumerate roles and actions for a lab application.
2. Build the expected matrix before testing.
3. Test ten cells with two accounts.
4. Run Autorize and verify three flagged requests manually.
5. Write results in the AUTHZ table format.

## Further reading

- OWASP WSTG — Authorisation testing (WSTG-ATHZ).
- OWASP Top 10 — A01 Broken Access Control.
- OWASP API Security Top 10 — BOLA and BFLA.
