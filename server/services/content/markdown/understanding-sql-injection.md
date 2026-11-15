## What injection actually is

SQL injection is not a list of payloads. It is a **boundary failure**: untrusted data crosses from the "value" side of a query into the "code" side. Every mitigation you have heard of — prepared statements, allow-lists, escaping — exists to keep that boundary intact.

Once you can point at the exact character where data becomes syntax, injection stops being mysterious.

## The query boundary

Consider a login check written the way most tutorials show it:

```js
// vulnerable — do not copy into anything real
const sql = `SELECT id, username FROM users
             WHERE username = '${username}' AND password_hash = '${passwordHash}'`;
const [rows] = await connection.query(sql);
```

The intended query is:

```sql
SELECT id, username FROM users
WHERE username = 'glorison' AND password_hash = 'abc123';
```

Now submit a username of `' OR 1=1 -- ` and read what the database actually receives:

```sql
SELECT id, username FROM users
WHERE username = '' OR 1=1 -- ' AND password_hash = 'abc123';
```

The `'` closed the string literal. `OR 1=1` made the predicate true for every row. `-- ` commented out the password check. The database is not broken; it did exactly what the constructed string asked.

> [!WARNING]
> Hashing passwords does not prevent injection. The attack targets the query structure, not the stored value — the password hash never has to be correct.

## Proving it safely

On an authorised target the first probe should be a **syntax-aware** one, not a destructive payload. A single quote that changes the response indicates the value reaches the parser:

```http
GET /product?id=1' HTTP/1.1
Host: shop.local
```

Compare three responses:

| Input | Expected if parameterised | Expected if injectable |
| --- | --- | --- |
| `1` | Product page | Product page |
| `1'` | Product page (literal quote) | 500 / database error |
| `1 AND 1=1` | Product page | Product page |
| `1 AND 1=2` | Product page | Empty result |

That last row is the important one. A true condition and a false condition returning different content means the database is evaluating your input.

### Union-based extraction

When the result is reflected into the page, `UNION SELECT` lets you read other tables. Column count first:

```sql
1 ORDER BY 1 -- 
1 ORDER BY 2 -- 
1 ORDER BY 3 --   (error → two columns)
```

Then align types and read metadata:

```sql
-1 UNION SELECT username, password_hash FROM users -- 
```

On MySQL, `information_schema` exposes the schema:

```sql
-1 UNION SELECT table_name, column_name
   FROM information_schema.columns
   WHERE table_schema = database() -- 
```

### Blind injection

When nothing is reflected, the answer comes from behaviour rather than output:

```sql
-- boolean-based: does the first character of the admin hash exceed 'm'?
1 AND SUBSTRING((SELECT password_hash FROM users LIMIT 1),1,1) > 'm'

-- time-based: MySQL sleeps only if the condition holds
1 AND IF(SUBSTRING((SELECT database()),1,1)='a',SLEEP(3),0)
```

Blind extraction is slow by hand. Tools like `sqlmap` automate the loop, but only after you have confirmed the injection point and understood the query — otherwise you are asking a tool to guess on your behalf.

## The fix that actually holds

Parameterised queries send the SQL text and the values as **separate protocol messages**. The database parses the statement once, with placeholders, then binds values that can never become syntax.

```js
// parameterised — the value is data, always
const [rows] = await connection.execute(
  "SELECT id, username FROM users WHERE username = ? AND password_hash = ?",
  [username, passwordHash],
);
```

For identifiers — column or table names — placeholders do not apply. Allow-list them:

```js
const SORTABLE = new Set(["created_at", "title", "published_at"]);
const orderBy = SORTABLE.has(req.query.sort) ? req.query.sort : "created_at";

// the identifier is chosen from a fixed set, never interpolated from input
const sql = `SELECT id, title FROM articles ORDER BY ${orderBy} DESC LIMIT ?`;
```

> [!TIP]
> If a query builder forces you to concatenate a value, that is a signal to restructure the query — not to escape harder.

## Defence in depth

Parameterisation removes the injection class. These layers limit the damage from everything else:

1. **Least privilege** — the application user needs `SELECT, INSERT, UPDATE` on its own schema and nothing else. No `FILE`, no `DROP`, no cross-schema reads.
2. **Typed validation** — an integer path parameter should be parsed as an integer before it reaches the data layer.
3. **Error handling** — never return database errors to the client. Log them server-side, return a generic message.
4. **Logging and alerting** — a spike of syntax errors from one session is a detection signal, not noise.
5. **WAF as a seatbelt** — useful, but bypassable. It is not a substitute for the fix.

## A review checklist

When you read code rather than test it, grep for the pattern that makes injection possible:

```bash
# string-built SQL in a Node codebase
grep -rnE "(query|execute)\(\s*\`" src/
grep -rn "connection.query(.*+.*)" src/
```

Then confirm each hit:

- Does the interpolated value originate from a request, header, or stored user content?
- Is the statement parameterised on the same line?
- Is an identifier (column, table, direction) taken from input?

## Lessons Learned

- Injection is a **structural** bug. Find the boundary, then fix the structure.
- A single quote is a diagnostic, not an exploit.
- `UNION` and blind techniques answer different questions — reflected output versus binary truth.
- The strongest control is the one applied at the query, not at the edge.

## References

- OWASP — SQL Injection Prevention Cheat Sheet
- OWASP WSTG — Testing for SQL Injection (WSTG-INPV-05)
- PortSwigger Web Security Academy — SQL injection
