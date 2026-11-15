## Injection is a boundary failure

SQL injection happens when data crosses into the query language without being
separated from it. Payload lists treat symptoms; understanding the boundary treats
the cause.

## Learning objectives

- Detect injection through behaviour, not through error strings alone.
- Choose between union, boolean, time-based and error-based confirmation.
- Extract the minimum data needed to prove impact.
- Write the parameterised fix for the same query.

## Prerequisites

- A lab with a deliberately vulnerable endpoint (PortSwigger, DVWA, or your own).
- Burp Suite or curl.
- Basic SQL: `SELECT`, `WHERE`, `UNION`, `LIMIT`.

## Start with the query

Imagine the handler:

```sql
SELECT id, title, body FROM articles WHERE slug = '<input>' LIMIT 1;
```

Input `' OR '1'='1` produces:

```sql
SELECT id, title, body FROM articles WHERE slug = '' OR '1'='1' LIMIT 1;
```

That is the whole class. Everything else is technique.

## Detection

Send a benign value, then variants:

```bash
curl -s "https://lab.example/article?slug=hello"      # baseline
curl -s "https://lab.example/article?slug=hello'"     # syntax error?
curl -s "https://lab.example/article?slug=hello''"    # still valid?
```

Signals:

- Different body or length for a single quote.
- A database error message.
- A change in response time.
- A different status code.

> [!NOTE]
> Absence of an error is not absence of injection. Filters often turn a syntax
> error into a generic 500.

## Confirmation techniques

| Technique | When to use | Trade-off |
| --- | --- | --- |
| Boolean | Response differs for true/false conditions | Reliable, slower |
| Union | Column count known, output reflected | Fast, needs matching types |
| Time-based | No output difference | Slow, noisy |
| Error-based | Errors are reflected | Fast, environment-specific |
| Out-of-band | No output at all | Needs external listener |

### Boolean

```sql
' AND '1'='1     -- true, normal page
' AND '1'='2     -- false, different page
```

If the two responses differ consistently, you have confirmation. This is the
least invasive proof and usually enough for a report.

### Union

Find the column count:

```sql
' ORDER BY 1-- -
' ORDER BY 2-- -
' ORDER BY 3-- -      -- error here means two columns
```

Then match types:

```sql
' UNION SELECT 1,2,3-- -
' UNION SELECT 1,@@version,3-- -
```

Only extract what proves the finding: database version, current user, or a table
name. Dumping a customer table is unnecessary and often a policy violation.

### Time-based

```sql
' AND SLEEP(5)-- -
```

Compare with a baseline request. A consistent five-second delay is confirmation
even when the body is identical. Use a small delay; long sleeps look like an
attack and waste time.

## Filter bypasses

When simple payloads fail, the filter is the puzzle:

| Filter | Bypass idea |
| --- | --- |
| Space blocked | Comments `/**/`, tabs, `%09` |
| `UNION SELECT` blocked | Mixed case, comments, `UNION/**/SELECT` |
| Quotes escaped | Numeric context, `CHAR()` |
| Keywords blacklisted | Equivalent syntax, encoding |

Test whether the filter is applied to the raw or decoded input. Double encoding
(`%2527`) sometimes reaches the database as `%27`, then as `'`.

## Authentication bypass, historically

```sql
-- Vulnerable login check
SELECT * FROM users WHERE email = '<email>' AND password = '<password>';
```

Input `' OR 1=1-- -` in the email field can turn the condition into a tautology.
Modern applications hash passwords and parameterise queries, so this exact form is
rare in production. It remains a useful demonstration of the class.

## The fix

Parameterise the query. Data never becomes syntax:

```js
// Vulnerable
const rows = await db.query(
  `SELECT id, title FROM articles WHERE slug = '${slug}' LIMIT 1`,
);

// Fixed: bound parameters
const rows = await db.query(
  "SELECT id, title FROM articles WHERE slug = ? LIMIT 1",
  [slug],
);
```

For ORMs, use the query API rather than raw fragments:

```js
const article = await Article.findOne({ slug }); // value is escaped by the driver
```

Additional controls, in order of value:

1. Least-privilege database accounts (no `FILE`, no `DROP`).
2. Input validation for shape (not as the primary defence).
3. Error handling that never returns database messages.
4. WAF rules as a mitigation, never as the fix.

## Common mistakes

- Reporting a SQL error as injection without confirming a true/false difference.
- Extracting more data than needed to prove impact.
- Testing only GET parameters; JSON bodies and headers are injected too.
- Ignoring second-order injection, where stored data is concatenated later.
- Trusting an ORM: raw fragments and `whereRaw` reintroduce the class.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Manual detection | Burp Repeater |
| Request replay | curl |
| Confirmation and extraction | sqlmap (with `--batch` and tight scope) |
| Lab practice | PortSwigger Academy SQLi labs |

## Practice lab

1. On a lab endpoint, compare single-quote and double-quote responses.
2. Confirm injection with a boolean pair and record both responses.
3. Determine the column count with `ORDER BY`.
4. Extract the database version only.
5. Rewrite the vulnerable query with bound parameters and verify the payload no
   longer changes behaviour.

## Further reading

- OWASP — SQL Injection Prevention Cheat Sheet.
- PortSwigger Academy — SQL injection labs.
- OWASP WSTG — Testing for SQL injection (WSTG-INPV-05).
