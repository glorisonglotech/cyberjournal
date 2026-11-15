## Uploads are three controls pretending to be one

An upload handler usually checks the extension, the MIME type the browser sent,
and maybe the file signature. Each check can be bypassed independently. What
matters afterwards is where the file lands and what can execute it.

## Learning objectives

- Test extension, MIME and content checks separately.
- Determine whether uploaded files are served, executed or parsed.
- Identify path traversal and filename handling issues.
- Recommend storage architecture that removes execution risk.

## Prerequisites

- A lab with an upload feature.
- Burp Suite (to modify filename and `Content-Type`).
- A local copy of a small valid image and a PHP/JSP test file.

## Step 1 — Establish the baseline

Upload a normal image and record:

- Whether the response includes a URL.
- The final filename and path.
- The `Content-Type` returned when you request it.
- Whether the file is served from the application origin or object storage.

```bash
curl -s -I https://lab.example/uploads/photo.jpg
```

If the file is served from the same origin with a type the server executes, the
risk is much higher.

## Step 2 — Test each control separately

| Test | Change | Expected secure behaviour |
| --- | --- | --- |
| Extension | `shell.php` | Rejected |
| Double extension | `shell.php.jpg` | Handled, not executed |
| MIME type | `Content-Type: image/png` with PHP body | Rejected by content check |
| Magic bytes | Valid PNG header + PHP body | Rejected or stored inertly |
| Case | `shell.PHP` | Rejected |
| Null byte | `shell.php%00.jpg` | Rejected |
| Trailing dot/space | `shell.php.` | Normalised safely |

Send a valid image first, then modify exactly one property per request.

## Step 3 — Understand the storage path

```http
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=...

Content-Disposition: form-data; name="file"; filename="../../avatar.png"
Content-Type: image/png
```

Filename traversal (`../../`) can write outside the intended directory. A server
that sanitises the extension but not the path is still vulnerable.

Also test filenames that break application logic downstream: very long names,
Unicode, and names that collide.

## Step 4 — Determine execution

Upload a harmless marker file with a server-side extension and request it:

```bash
curl -s https://lab.example/uploads/test.php
```

- Body returned as text → no execution, lower impact.
- Executed → remote code execution.
- Downloaded → still test path traversal and stored XSS via filename.

If the application renders filenames in HTML, an HTML filename can produce stored
XSS even when execution is impossible.

## Step 5 — SVG and polyglot content

SVG is an image that can carry script:

```xml
<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)"/>
```

Served inline, it executes in the application's origin. Many upload filters allow
SVG because it is an image. Test whether the response uses
`Content-Disposition: attachment` and a non-renderable `Content-Type`.

## Step 6 — Prove impact safely

For RCE, use a command that proves execution without changing the system:

```bash
# In an authorised lab only
<?php echo shell_exec('id'); ?>
```

Do not establish persistence, read credentials, or move laterally. The response
is the evidence.

## The fix

1. **Store outside the web root** and serve through an application route or object
   storage with a fixed `Content-Type`.
2. **Generate filenames** yourself; never trust the client's name or extension.
3. **Validate content**, not just headers: decode the image and re-encode it.
4. **Set `Content-Disposition: attachment`** and `X-Content-Type-Options: nosniff`.
5. **Restrict types** to an allow-list and reject SVG unless required.
6. **Scan** uploads asynchronously and isolate them from the application origin.

## Common mistakes

- Testing only the extension and declaring the handler secure.
- Forgetting to check what `Content-Type` is returned on retrieval.
- Missing polyglot files that pass both image and script checks.
- Overlooking filename-based stored XSS.
- Reporting "upload possible" without stating what the file can do.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Request manipulation | Burp Suite |
| File inspection | `file`, `xxd`, exiftool |
| Retrieval checks | curl |
| Lab practice | PortSwigger Academy upload labs |

## Practice lab

1. Upload a valid image and record the returned path and content type.
2. Change only the extension to `.php` and observe the response.
3. Change only the `Content-Type` while keeping a valid image body.
4. Create a polyglot with a PNG header and script content; test acceptance.
5. Try a traversal filename and check where the file is stored.

## Further reading

- OWASP — File Upload Cheat Sheet.
- PortSwigger Academy — File upload vulnerabilities labs.
- OWASP WSTG — Test file upload handling.
