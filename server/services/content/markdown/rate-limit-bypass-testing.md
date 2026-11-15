## Rate limits protect other controls

A login limit protects passwords. An OTP limit protects MFA. A search limit
protects data. When the limit can be bypassed, the control behind it is what
actually fails — which is why "no rate limit" alone is rarely the finding.

## Learning objectives

- Identify which endpoints need limits and what each limit protects.
- Test bypass classes: identity, transport and representation.
- Measure a bypass rather than assuming one.
- Write the finding around the resulting abuse path.

## Prerequisites

- A lab with OTP or login endpoints.
- Burp Intruder, ffuf, or a small script.
- Permission to send repeated requests.

## Step 1 — Establish the limit

```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null -w '%{http_code} ' \
    -X POST https://lab.example/api/otp/verify \
    -H 'Content-Type: application/json' \
    -d '{"code":"000000"}'
done; echo
```

Record when the response changes (429, captcha, lockout) and what the limit is
keyed on. Ten attempts per account is different from ten per IP.

## Step 2 — Bypass by identity

If the limit is keyed on something you control, you can rotate it.

| Key | Rotation idea |
| --- | --- |
| IP address | `X-Forwarded-For`, `X-Real-IP`, `Client-IP` |
| Account | Case or whitespace variants of the identifier |
| Session | New session per attempt |
| Device | New device identifier header |
| API key | Multiple free keys (check the policy) |

```bash
for ip in 10.0.0.$((RANDOM%250)); do :; done
```

```bash
seq 50 | while read -r i; do
  curl -s -o /dev/null -w '%{http_code} ' \
    -H "X-Forwarded-For: 10.0.0.$i" \
    -H 'Content-Type: application/json' \
    -d '{"code":"000000"}' \
    https://lab.example/api/otp/verify
done; echo
```

If the 429 never appears, the limit trusts a spoofable header.

> [!WARNING]
> Header rotation is noisy and can trip abuse detection. Keep request counts low
> and stop once the bypass is demonstrated.

## Step 3 — Bypass by representation

Servers normalise paths and identifiers inconsistently:

```text
/api/login
/api/login/
//api/login
/api/./login
/api/%6cogin
/api/login?x=1
```

If the limiter matches on the raw path and the router normalises it, each variant
may get its own counter. Test a handful, not hundreds.

Similarly for identifiers:

```text
victim@example.com
Victim@example.com
victim@example.com.
victim+1@example.com   (may deliver to the same inbox)
```

Case and trailing-character variants are the most common wins.

## Step 4 — Bypass by concurrency

Some limiters increment a counter after the request completes. Firing many
requests simultaneously can pass more attempts than the limit allows.

```bash
seq 30 | xargs -P 30 -I{} curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST https://lab.example/api/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"code":"000000"}'
```

Count how many were processed versus rejected. That number is your evidence.

## Step 5 — Chain to impact

A bypass matters when it unlocks brute force:

| Endpoint | Space | Attempts needed (expected) |
| --- | --- | --- |
| 6-digit OTP | 1,000,000 | ~500,000 for 50% |
| 4-digit PIN | 10,000 | ~5,000 |
| Password | Dictionary | Depends on policy |

For a 6-digit OTP, a 10-attempt limit that can be bypassed is a practical account
takeover. For a 4-digit PIN with a 100-attempt limit, it is critical. For a
password with a strong policy and a 10-attempt limit, bypass alone may be
informational.

Quantify: requests per second, attempts per window, and the size of the secret
space. Do not actually brute force a real user's account.

## The fix

- Key limits on server-side identity, not client headers.
- Apply limits at the edge and in the application (defence in depth).
- Count failures, not just requests, and lock the account after a threshold.
- Make OTPs single-use, short-lived, and bound to the session.
- Use exponential backoff and alerting.

## Common mistakes

- Reporting "no rate limit" without an abuse path.
- Testing with a spoofed header and assuming production trusts it.
- Sending thousands of requests and causing an incident.
- Missing per-account limits that exist behind a passing IP limit.
- Forgetting that CAPTCHA may trigger before a 429.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Sequential tests | curl loop |
| Parallel tests | xargs, turbo-intruder |
| Header rotation | Burp Intruder |
| Path variants | ffuf with a custom list |

## Practice lab

1. Measure the OTP attempt limit on a lab endpoint.
2. Rotate `X-Forwarded-For` and see whether the limit resets.
3. Test path normalisation variants against the same limiter.
4. Fire 30 parallel attempts and count processed requests.
5. Estimate the time to brute force a 4-digit PIN with the observed bypass.

## Further reading

- OWASP — Authentication and credential stuffing cheat sheets.
- PortSwigger Academy — Authentication labs with brute-force protection.
- OWASP API Security Top 10 — Unrestricted resource consumption.
