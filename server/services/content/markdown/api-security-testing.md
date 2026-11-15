## APIs fail on authorisation, not on payloads

Web application testing spends time on rendering and forms. API testing spends
time on objects, tokens and tenancy — where the impact is usually data exposure
rather than a script alert.

## Learning objectives

- Discover API surface from documentation, clients and traffic.
- Test object-level and function-level authorisation systematically.
- Identify mass assignment and excessive data exposure.
- Test token lifecycle and API versioning drift.

## Prerequisites

- Two accounts, ideally in different tenants.
- Postman or curl plus Burp Suite.
- The API documentation, if published.

## Step 1 — Discover the surface

Sources, in order of value:

1. **Documentation** — OpenAPI/Swagger at `/docs`, `/openapi.json`, `/swagger.json`.
2. **Client traffic** — the web and mobile apps call endpoints the docs omit.
3. **Versioning** — `/v1`, `/v2`, `/beta`, `/internal` may coexist.
4. **Error messages** — "missing parameter X" reveals expected fields.
5. **Fuzzing** — short wordlists against API paths.

```bash
curl -s https://api.example.com/openapi.json | jq '.paths | keys[]'
```

Mobile builds are useful: extract strings and endpoints from the bundle, then test
the same host with the web token.

## Step 2 — Object-level authorisation (BOLA)

For every endpoint with an identifier:

```http
GET /api/v1/projects/{projectId} HTTP/1.1
Authorization: Bearer <user-B-token>
```

Test:

- Changing the identifier to another user's object.
- Removing the identifier where a list endpoint exists.
- Nested references (`/projects/1/members/2`).
- Filter parameters (`?accountId=other`).

Record the exact response proving cross-user data. That response is the finding.

## Step 3 — Function-level authorisation (BFLA)

Call administrative operations with a normal token:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X DELETE https://api.example.com/api/v1/users/42 \
  -H "Authorization: Bearer $USER_TOKEN"
```

Also test HTTP method variations: an endpoint may check `GET` but not `DELETE`.

## Step 4 — Mass assignment

APIs that bind request bodies directly to models accept fields you were never meant
to set.

```http
PATCH /api/v1/users/me HTTP/1.1
Content-Type: application/json

{"name":"Test","role":"admin","verified":true,"credits":99999}
```

Try fields found in:

- GET responses (they reveal the model).
- Documentation schemas.
- Error messages listing allowed fields.
- Guesses: `role`, `is_admin`, `tenant_id`, `balance`, `status`.

A single successful privilege field is high impact.

## Step 5 — Excessive data exposure

Compare what the UI shows with what the API returns:

```bash
curl -s https://api.example.com/api/v1/users/me -H "Authorization: Bearer $T" | jq
```

Password hashes, internal IDs, other users' emails and admin flags in a "public"
response are findings, especially when combined with BOLA.

## Step 6 — Token handling

| Test | What to check |
| --- | --- |
| Expiry | Does an expired token still work? |
| Revocation | Does logout invalidate the token server-side? |
| Scope | Can a read-only token write? |
| Audience | Can a token for service A call service B? |
| Algorithm | Is the JWT algorithm enforced? |

## Step 7 — Versioning and deprecation

Old versions are the most productive area in most programmes.

```bash
for v in v1 v2 v3 beta internal; do
  printf '%s ' "$v"
  curl -s -o /dev/null -w '%{http_code}\n' "https://api.example.com/$v/users/me"
done
```

Deprecated versions often lack the authorisation fixes added later.

## Step 8 — Rate limits and abuse

Test limits on expensive or sensitive endpoints: search, export, OTP, password
reset. Record the threshold and what it protects. A missing limit is only a finding
when it enables a concrete abuse path.

## The fix

- Authorise at the data layer: query by `owner_id` from the session.
- Use allow-lists when binding request bodies to models.
- Return response schemas, not raw documents.
- Validate token signature, algorithm, audience and expiry on every service.
- Retire old API versions with a hard deadline.

## Common mistakes

- Testing only documented endpoints.
- Using one account and calling authorisation "fine".
- Ignoring nested resources.
- Reporting missing headers instead of data exposure.
- Forgetting that mobile and web tokens may have different scopes.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Request workbench | Postman, Insomnia |
| Interception and replay | Burp Suite |
| JSON inspection | jq |
| Endpoint fuzzing | ffuf, kiterunner-style wordlists |

## Practice lab

1. Find an OpenAPI document and list every endpoint with an identifier.
2. Test three of them with a second account's token.
3. Attempt mass assignment with `role` and `verified`.
4. Compare a GET response with the UI to find leaked fields.
5. Test an expired token against a protected endpoint.

## Further reading

- OWASP API Security Top 10 — BOLA, BFLA, mass assignment.
- OWASP WSTG — API testing.
- PortSwigger Academy — API testing labs.
