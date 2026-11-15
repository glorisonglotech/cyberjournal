## The most common paid finding

Every object in a web application has an owner. Broken access control means the
server checked whether you were logged in, but not whether the object was yours.

## Learning objectives

- Distinguish horizontal, vertical and tenant-level authorisation failures.
- Find object references in URLs, bodies, headers and GraphQL variables.
- Prove cross-user impact with two accounts and no assumptions.
- Recommend a fix that enforces ownership at the data layer.

## Prerequisites

- Two accounts on the target, ideally in different tenants.
- Burp Suite with Repeater.
- A notes file mapping endpoints to objects.

## Three failure shapes

| Shape | Example | Impact |
| --- | --- | --- |
| Horizontal | User A reads invoice 4822 belonging to user B | Data exposure |
| Vertical | Normal user calls an admin endpoint | Privilege escalation |
| Tenant | Tenant A reads tenant B's records via a shared API | Cross-tenant breach |

The third is the most severe and the least tested, because testers rarely sign
up twice.

## Where object references hide

- Path segments: `/api/invoices/4821`
- Query parameters: `?user_id=812`
- JSON bodies: `{"account_id": "812"}`
- Headers: `X-Tenant-Id: 42`
- GraphQL variables and node IDs
- Mobile API payloads that the web client never sends

If an identifier appears anywhere in the request, it is user input.

## The two-account method

1. Create user A and user B. Give each one object of every type (project, invoice,
   file, message).
2. Capture A's request for its object.
3. Replace A's session with B's session, keeping the object ID.
4. Record the response.

```http
GET /api/invoices/4821 HTTP/1.1
Host: app.example.com
Authorization: Bearer <token-of-B>
```

If that returns A's invoice, you have a horizontal IDOR. The proof is the JSON
body containing A's data while using B's token.

> [!IMPORTANT]
> Proving IDOR requires the response, not just a 200 status. A generic error page
> with status 200 is not evidence.

## Vertical checks

Map roles first:

```text
role      can_view_users  can_edit_users  can_export
user      no              no              no
manager   yes             no              yes
admin     yes             yes             yes
```

Then call every privileged endpoint with the lowest role token. Do not rely on
the UI hiding buttons; the API is the boundary.

```bash
curl -s -o out.json -w '%{http_code}\n' \
  -H "Authorization: Bearer $LOW_PRIV_TOKEN" \
  https://target.example/api/admin/users
```

A `200` with data is the finding. A `403` is the expected result and still worth
recording, because the next endpoint may not match.

## Tenant isolation

Test with two organisations if the product supports them:

1. Create org A and org B.
2. As A's owner, note the org identifier in every request.
3. Replace it with B's identifier.
4. Also test removing the identifier entirely (some APIs default to the caller's
   tenant, others default to a global scope).

Header-based tenancy is often weaker than path-based tenancy because middleware
may resolve it inconsistently across services.

## Indirect references

Numeric IDs are obvious. Indirect references are not:

- UUIDs: still testable, but you need a legitimate one to swap.
- Hashed IDs: check whether the hash is predictable or unsalted.
- Sequential slugs: `invoice-2026-0001` reveals structure.
- GraphQL global IDs: base64 of `Type:123`, trivially decodable.

```bash
echo 'VXNlcjoxMjM=' | base64 -d   # User:123
```

## Proving impact without harm

Use your own two accounts. Stop at the minimum evidence: the returned record's
identifier and one or two fields that prove ownership, not the full dataset.

```text
GET /api/documents/9931 (token: user B)
200 {"id":9931,"owner":"user_a","title":"Q3 planning","content":"..."}
```

That is enough. Do not page through other users' data.

## The fix

Authorisation must be enforced server-side, at the query level:

```js
// Vulnerable: trusts the identifier from the client
const doc = await Document.findById(req.params.id);

// Fixed: scopes the query to the authenticated principal
const doc = await Document.findOne({ _id: req.params.id, owner: req.user.id });
```

For tenant data, scope by tenant from the session, never from the request body:

```js
const tenantId = req.user.tenantId;
const rows = await Record.find({ tenantId });
```

## Common mistakes

- Testing with a single account and calling an endpoint "secure".
- Reporting a 200 without showing the data.
- Missing the mobile API, which often has older authorisation code.
- Forgetting file downloads: `/api/files/123/download` may bypass the JSON check.
- Assuming UUIDs are unguessable, so untested.

## Toolbox

| Task | Tool |
| --- | --- |
| Request swapping | Burp Repeater |
| Automated authorisation sweeps | Autorize |
| API testing | Postman, curl |
| Role mapping | spreadsheet |

## Practice lab

1. Create two accounts and one object per account on a lab app.
2. Swap the session token while keeping the object ID; record the result.
3. Repeat for a nested object (`/projects/1/tasks/2`).
4. Call three admin endpoints with a normal user token.
5. Write the finding with the request, the response and the fix.

## Further reading

- OWASP WSTG — Authorisation testing (WSTG-ATHZ).
- OWASP Top 10 — A01 Broken Access Control.
- PortSwigger Academy — Access control labs.
