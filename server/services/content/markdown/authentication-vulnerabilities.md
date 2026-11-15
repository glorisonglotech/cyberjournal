## Authentication is a state machine

Login is one transition. The bugs live in the others: registration, verification,
password reset, MFA enrolment, session refresh, logout and account linking.

## Learning objectives

- Enumerate the authentication surface before testing it.
- Detect user enumeration through timing, status and message differences.
- Test reset and invitation flows for token binding failures.
- Recognise MFA bypass patterns that are logic bugs rather than crypto failures.

## Prerequisites

- Two accounts you control on the target.
- Burp Suite with the target in scope.
- A rate-limit-aware mindset.

## Map the surface

| Flow | Requests to capture |
| --- | --- |
| Login | Success, failure, unknown user, locked account |
| Registration | New email, existing email, invalid email |
| Verification | Valid token, expired token, reused token |
| Password reset | Request, consume, reuse, wrong account |
| MFA | Enrol, verify, disable, recovery codes |
| Session | Refresh, logout, concurrent sessions |

Capture every response before changing anything. The baseline is the finding.

## User enumeration

Registration and reset flows are the usual leaks.

```bash
# Compare responses for a known and unknown account
curl -s -o /dev/null -w '%{http_code} %{size_download} %{time_total}\n' \
  -X POST https://target.example/api/auth/forgot \
  -H 'Content-Type: application/json' \
  -d '{"email":"known@example.com"}'

curl -s -o /dev/null -w '%{http_code} %{size_download} %{time_total}\n' \
  -X POST https://target.example/api/auth/forgot \
  -H 'Content-Type: application/json' \
  -d '{"email":"unknown-9182@example.com"}'
```

Differences in status, length or timing indicate enumeration. A well-built flow
returns the same message and takes similar time in both cases.

> [!NOTE]
> Enumeration alone is often informational. It becomes meaningful when chained
> with a weak password policy, no rate limit, or an OTP flow.

## Password reset logic

Test these properties, in order:

1. **Token binding.** Request a reset for account A, then use the token with
   account B's identifier. If it succeeds, the token is not bound.
2. **Token reuse.** Consume a token, then replay it.
3. **Expiry.** Wait past the stated expiry and retry.
4. **Host header injection.** Change the `Host` header and see whether the reset
   link in the email points at your domain.
5. **Response leakage.** Some APIs return the token in the response body.

```http
POST /api/auth/reset HTTP/1.1
Host: attacker.example
Content-Type: application/json

{"email":"victim@example.com"}
```

If the generated link uses the `Host` header, the victim receives a link to
`attacker.example` with a valid token.

## Session handling

| Test | Method |
| --- | --- |
| Fixation | Set a session cookie before login; see whether it survives authentication |
| Rotation | Compare the token before and after privilege change |
| Logout | Replay the old cookie after logout |
| Concurrency | Two sessions for one account; does one invalidate the other? |

A session identifier that does not change on login is a fixation risk when an
attacker can plant one.

## MFA bypass patterns

MFA implementations fail at the flow level more often than in the algorithm:

- **Direct navigation.** After password verification, request `/dashboard`
  directly. Some apps set the session before MFA completes.
- **Response rewriting.** Check whether the server returns a flag such as
  `"mfa_required": true` and trusts the client to enforce it.
- **Code reuse.** Verify whether an OTP can be reused within its window.
- **Brute force.** Check the attempt limit on the OTP endpoint specifically.
- **Recovery codes.** Test whether they are single-use and rate limited.

## Credential policies

Check the policy by observation, not by assumption:

```bash
# Does the API reject weak passwords, or only the UI?
curl -s -X POST https://target.example/api/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"tester+1@example.com","password":"password"}'
```

If the UI rejects but the API accepts, the policy is cosmetic. That is a valid
finding when combined with realistic impact.

## Common mistakes

- Testing only the happy path.
- Changing email and password in the same request, losing attribution.
- Brute forcing OTPs without checking the policy's rules or the attempt limit.
- Reporting enumeration as high severity with no chain.
- Forgetting to test the mobile or API flow, which often lags the web one.

## Toolbox

| Task | Tool |
| --- | --- |
| Flow capture | Burp Suite |
| Enumeration checks | curl, ffuf |
| Token analysis | jwt.io, jwt_tool |
| Timing measurement | curl `%{time_total}`, or a small script |

## Practice lab

1. Map all authentication requests on a lab application.
2. Compare known and unknown account responses for login, registration and reset.
3. Test reset token binding by requesting for one account and consuming with another.
4. Check whether the session identifier rotates on login.
5. Attempt direct navigation to a post-MFA page before completing MFA.

## Further reading

- OWASP WSTG — Authentication testing (WSTG-ATHN).
- OWASP Authentication Cheat Sheet.
- PortSwigger Academy — Authentication vulnerabilities labs.
