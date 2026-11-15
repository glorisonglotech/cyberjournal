## Scanners do not understand your business

A logic flaw is a valid sequence of requests that produces an outcome the
designer did not intend. There is no payload list, because the "payload" is an
order of operations.

## Learning objectives

- Model a workflow as a state machine before testing it.
- Find trust in client-supplied values: price, quantity, role, status.
- Test sequence skipping, repetition and race conditions.
- Quantify impact in business terms.

## Prerequisites

- A shopping, booking or subscription flow in a lab.
- Burp Suite with Repeater and Intruder.
- A spreadsheet for state/transition notes.

## Step 1 — Model the intended flow

Write the happy path as states and transitions:

```text
cart -> checkout -> payment_pending -> paid -> fulfilled
             |               |
             +-> abandoned   +-> refunded
```

For each transition, record: who may trigger it, what data it accepts, and what it
checks. The bugs usually sit at transitions the model does not cover.

## Step 2 — Tamper with trusted values

The client should never be the source of truth for money, permissions or limits.

```http
POST /api/cart/add HTTP/1.1
Content-Type: application/json

{"product_id":"sku-1","quantity":1,"price":9999}
```

Change `price` to `1` or `0`. If the cart accepts it, the server trusts the client.
Repeat for `discount`, `currency`, `shipping`, `role` and `status`.

Negative quantities are a rich source of bugs:

```json
{"product_id":"sku-1","quantity":-5}
```

A negative quantity can invert totals, create credit, or bypass a minimum.

## Step 3 — Skip steps

Request a later step directly. Applications often enforce order only in the UI.

- Call `/checkout/complete` without a payment step.
- Access the post-payment confirmation with an unpaid order.
- Submit a review before purchase.
- Approve your own request by calling the approval endpoint.

```bash
curl -s -X POST https://lab.example/api/orders/123/complete \
  -H "Authorization: Bearer $TOKEN"
```

If the order moves to `paid`, you found a state-machine bypass.

## Step 4 — Replay and repeat

Idempotency is a security property.

- Submit the same coupon code twice; does the discount apply twice?
- Replay a withdrawal request; does the balance decrease twice?
- Reuse a one-time invite link.
- Re-submit a refund after it completes.

```bash
# Send the same request 20 times concurrently
seq 20 | xargs -P 20 -I{} curl -s -X POST \
  https://lab.example/api/coupons/redeem \
  -H "Authorization: Bearer $TOKEN" \
  -d 'code=SAVE10' -o /dev/null -w '%{http_code}\n'
```

## Step 5 — Race conditions

Two requests that each pass a check can together violate it. A balance of 100 with
two simultaneous withdrawals of 100 may produce -100.

Use a single-packet or parallel technique in an authorised lab, then look for:

- Duplicate redemptions.
- Overdrawn balances.
- Two resources created where only one was allowed.
- Duplicate votes or ratings from one account.

> [!NOTE]
> Rate limits are not a fix for races. The invariant must be enforced atomically in
> the database (conditional update or transaction).

## Step 6 — Boundaries and units

| Test | Example |
| --- | --- |
| Rounding | 0.005 stored as 0.01 twice |
| Currency | Pay in a weaker currency, receive in a stronger one |
| Unit confusion | Milliseconds vs seconds in an expiry |
| Limits | "One per customer" checked per email, not per account |
| Time zones | Expiry evaluated in the client's zone |

## Step 7 — Quantify impact

Business logic findings need a business sentence:

> A user can redeem the same one-time coupon unlimited times, reducing the order
> total to zero. With a $50 minimum order, this is an unlimited free-order path.

That is triageable. "Price manipulation" on its own is not.

## The fix

- Recalculate all financial values server-side from authoritative data.
- Enforce state transitions with explicit guards: `if (order.status !== "pending") reject`.
- Make redemptions atomic: a unique index or conditional update.
- Treat client-provided status, role and price as untrusted input.
- Log and alert on impossible transitions.

## Common mistakes

- Testing only one request instead of the flow.
- Ignoring negative and fractional numbers.
- Missing replay because the UI disables the button (the API does not).
- Reporting a race without a reproducible measurement.
- Describing the bug without the financial consequence.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Flow capture | Burp Suite |
| Parallel requests | turbo-intruder, xargs, small scripts |
| State notes | spreadsheet |
| Lab practice | PortSwigger Academy business logic labs |

## Practice lab

1. Model a checkout flow as states and transitions.
2. Tamper with a price and a quantity; record server responses.
3. Call a later step directly and observe whether it is allowed.
4. Replay a coupon redemption ten times concurrently.
5. Write an impact statement in business terms.

## Further reading

- OWASP WSTG — Business logic testing (WSTG-BUSL).
- PortSwigger Academy — Business logic vulnerabilities labs.
- OWASP ASVS — Business logic security requirements.
