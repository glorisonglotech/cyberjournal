# Glorison Cyber Journal

An independent cybersecurity research publication — TryHackMe and Hack The Box writeups, CTF
walkthroughs, technical tutorials, vulnerability analysis and a news desk that links its sources.

**Tagline:** Breaking things, understanding why, and documenting the process.

Built as a MERN application: React + TypeScript + Vite on the front, Express + MongoDB + Mongoose
on the back, with JWT authentication and a Markdown publishing desk.

---

## 1. Stack

| Layer | Technology |
| --- | --- |
| Client | React 18, TypeScript, Vite 6, Tailwind CSS v4, React Router 6 |
| Content | react-markdown + remark-gfm, Prism.js, custom callouts / collapses / zoom |
| Server | Node.js, Express 4, Mongoose 8, JWT, bcrypt (bcryptjs), Multer |
| Hardening | Helmet, express-rate-limit, express-mongo-sanitize, CORS allow-list, same-origin guard |
| Icons | lucide-react |
| HTTP | Axios |

### Theming

Two themes share one identity, switched from a two-position control in the header:

- **Light (default)** — alabaster paper `#fafafa`, charcoal type `#09090b`, botanical green
  `#065f46`, sage secondary surface `#f2f7f4`, hairline rules `#e4e4e7`.
- **Dark** — matte obsidian `#050505`, off-white type `#f4f4f5`, zinc metadata `#a1a1aa`, phosphor
  green `#22c55e` used only for signal, cards `#111111` with `#222222` rules.

Every surface resolves from CSS custom properties (`--color-ink`, `--color-bone`, `--color-rule`,
`--color-signal`, `--prose-text`, …), so components are theme-agnostic. The visitor's choice is
persisted in `localStorage`; until they make one, the system `prefers-color-scheme` is followed
(including live OS changes). A pre-paint script in `index.html` resolves the theme before the
first frame, so there is no flash. Type is set in **Inter Tight** with **JetBrains Mono** for tags,
metadata and technical labels. Code blocks stay ink-dark in both themes — they read as terminal
surfaces set into the page.

## 2. Structure

```
glorison-cyber-journal/
├── client/
│   ├── public/
│   │   ├── covers/                 # hand-drawn SVG cover plates
│   │   └── owl-mark.svg            # favicon
│   └── src/
│       ├── components/             # nav, footer, markdown renderer, UI primitives
│       ├── context/                # session context (AuthProvider)
│       ├── hooks/                  # page meta, article fetching, reading position
│       ├── layouts/                # public shell, admin shell
│       ├── lib/                    # formatting + markdown preprocessing
│       ├── pages/                  # public pages + admin desk
│       ├── services/               # typed Axios API client
│       ├── types/                  # shared API types
│       ├── App.tsx
│       └── main.tsx
├── server/
│   ├── config/db.js                # MongoDB connection (URI or dev in-memory)
│   ├── controllers/                # auth, articles, categories, tags, admin, uploads
│   ├── middleware/                 # auth, error, upload, rate limits, origin guard
│   ├── models/                     # User, Article, Category, Tag
│   ├── routes/                     # REST routes
│   ├── services/
│   │   ├── content/                # demo article metadata + Markdown bodies
│   │   └── seed.js                 # database seeder
│   ├── uploads/                    # uploaded images (served at /uploads)
│   ├── utils/                      # slugify, reading time, sanitise, tokens, validation
│   └── server.js
├── .gitignore
└── README.md
```

## 3. Requirements

- Node.js **18+** (tested on Node 20)
- MongoDB **6/7** — optional for a first look:
  - If `MONGO_URI` is set, that database is used.
  - If it is empty in development, the API boots a disposable **in-memory MongoDB**
    (`mongodb-memory-server`, downloads the binary on first run). Everything works, but data is
    discarded when the API stops. Use a real MongoDB or Atlas URI for durable content.

## 4. Setup

```bash
# from the project root
npm run setup          # installs root, server and client dependencies

# configure the API
cp server/.env.example server/.env
# edit server/.env — at minimum set MONGO_URI and a fresh JWT_SECRET
#   openssl rand -hex 48

npm run seed           # creates the admin user, categories, tags and demo articles
npm run dev            # API on :5000 and client on :5173
```

Then open **http://localhost:5173**.

`npm run dev` runs both processes with `concurrently`. They can also be started separately:

```bash
npm run dev:api        # nodemon server/server.js
npm run dev:web        # vite
```

### Demo administrator

Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` **before** seeding. The checked-in defaults
create `admin@glorison.local` / `CyberJournal!2026` and are intended for local development only —
change them before deploying.

Sign in at **/admin/login**. The seeded password is bcrypt-hashed on creation and never returned by
the API.

### Re-seeding

`npm run seed` is idempotent. It always ensures the categories, tags and
administrator exist, then inserts only articles whose slug is missing. Content you
have edited in the admin desk is never overwritten.

```bash
npm run seed            # add anything new, keep everything else
npm run seed -- --force # delete all articles first — destructive, local use only
```

## 5. Pages

| Route | Purpose |
| --- | --- |
| `/` | Editorial homepage: hero, featured publication, latest index, categories, about |
| `/writeups` | Archive with platform / difficulty / category / tag filters and pagination |
| `/writeups/:platform/:slug` | Writeup reader (also `/writeups/:slug`) |
| `/tutorials` | Tutorial library, filtered by level |
| `/tutorials/:slug` | Tutorial reader |
| `/news` | News and analysis desk with source labelling |
| `/news/:slug` | News / research reader |
| `/about` | Publication, focus, philosophy, contact |
| `/search` | Global search over titles, bodies, tags, platforms, tools, categories |
| `/admin` | Dashboard: totals, drafts, distribution, recent activity |
| `/admin/articles` | Article table: filter, search, edit, delete |
| `/admin/articles/new` | Markdown editor with live preview |
| `/admin/articles/:id/edit` | Edit metadata, body, cover, SEO, status |
| `/admin/taxonomy` | Category and tag management |

## 6. Writing and publishing

1. **Admin → New article.**
2. Choose an **article type**. Metadata fields adapt:
   - `CTF Writeup` → platform, machine difficulty, operating system, skills covered
   - `Tutorial` → beginner / intermediate / advanced, skills
   - `Cybersecurity News` / `Research` → original source name + source URL
3. Write in Markdown. The toolbar inserts headings, code fences, tables, callouts and collapsible
   sections. The right pane renders a live preview with the real typography and syntax highlighting.
4. Upload a cover image (JPEG/PNG/WebP, max 4 MB) or paste an existing path.
5. **Save draft** keeps it private. **Publish** makes it public and stamps `publishedAt`.
   Publishing with an existing slug keeps the URL stable; slugs are generated once from the title.
6. **Unpublish** returns a published article to draft without deleting it.

### Markdown extensions

| Syntax | Renders as |
| --- | --- |
| `> [!NOTE]` / `TIP` / `WARNING` / `IMPORTANT` | Styled callout block |
| ` ```collapse Title ` | Collapsible section |
| ` ```bash … ``` ` | Terminal-style code block with copy button |
| `![alt](url)` | Image with click-to-zoom |
| Tables, lists, blockquotes, inline code | Standard GFM |

Reading time is computed server-side from prose length plus code blocks.

### The content library

The seed ships **62 entries**: 41 tutorials, 19 platform write-ups, one research
analysis and one news analysis.

| Collection | Coverage |
| --- | --- |
| Bug bounty (23) | Programmes, reconnaissance, subdomains, content discovery, HTTP, Burp, authentication, access control, SQLi, XSS, CSRF, SSRF, uploads, business logic, APIs, JWT, rate limits, disclosure, validation, report writing, responsible disclosure |
| Web pentesting (15) | Methodology, WSTG, OWASP Top 10, recon, Nmap, Gobuster/Feroxbuster, Burp workflows, SQLMap, FFUF, HTTP, cookies and sessions, authorisation matrices, server misconfiguration, manual discovery, reporting |
| Existing guides (3) | SQL injection fundamentals, Linux privilege escalation, API security |
| TryHackMe (7) | Linux fundamentals, OWASP Top 10, Blue, Kenobi, Simple CTF, AD basics, SOC fundamentals |
| Hack The Box (8) | Starting Point (Meow, Fawn, Dancing, Archetype), Lame, Nibbles, Blue, Forest |

Every entry states its objectives, prerequisites, practical steps, common
mistakes, tooling, exercises and references. The platform write-ups are
methodology records: values a solver obtains in the live room are redacted, the
terminal output is illustrative, and they carry the **Sample / Demonstration**
badge. No flag, incident, CVE or source is invented.

## 7. REST API

Base URL: `/api`. Authenticated admin requests use the `gcj_token` HttpOnly cookie set by login
(an `Authorization: Bearer <jwt>` header also works for API clients).

### Auth
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | `{ identifier, password }` → user + session cookie (rate limited) |
| GET | `/auth/me` | session | Current user |
| POST | `/auth/logout` | session | Clears the cookie |

### Articles
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/articles` | public | Published list — `page, limit, platform, difficulty, category, tag, articleType, sort` |
| GET | `/articles/featured` | public | Featured article (falls back to newest) |
| GET | `/articles/search?q=` | public | Search titles, bodies, tags, tools, platforms, categories |
| GET | `/articles/stats` | public | Published counts by type and platform (homepage panel) |
| GET | `/articles/:slug` | public | Article + related + previous/next |
| POST | `/articles` | admin | Create (draft or published) |
| PUT | `/articles/:id` | admin | Partial update |
| DELETE | `/articles/:id` | admin | Delete |

`articleType` accepts a comma-separated list (`ctf-writeup,tutorial`) for combined archives.
List responses are paginated: `{ articles, pagination: { page, limit, total, pages, hasMore } }`.

### Categories & tags
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/categories` | public (with published counts) |
| POST / PUT / DELETE | `/categories`, `/categories/:id` | admin |
| GET | `/tags` | public |
| POST / DELETE | `/tags`, `/tags/:id` | admin |

Deleting a category that still holds articles returns `409` with the count.

### Admin
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/admin/dashboard` | admin | Counts, recent publications, distribution |
| GET | `/admin/articles` | admin | All statuses — `status, q, page, limit` |
| GET | `/admin/articles/:id` | admin | Full article for editing |
| GET | `/admin/stats` | admin | Totals, top tags/tools, average reading time |

### Uploads
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/uploads` | admin | `multipart/form-data` field `image`; JPEG/PNG/WebP ≤ 4 MB |

---

## 8. Security

Implemented on the server, not the client:

- **Passwords** hashed with bcrypt (cost 12); `password` is `select: false` and never serialised.
- **Sessions** are JWTs delivered in an `HttpOnly` cookie (`SameSite=Lax` by default, `None` +
  `Secure` when `COOKIE_SAME_SITE=none` for split hosting). The secret is read from `JWT_SECRET`;
  the server refuses to start if it is missing or short.
- **Sign-out ends the session server-side.** Each user document carries a `tokenVersion` that is
  embedded in the token and incremented on logout, so a token captured before sign-out is rejected
  rather than remaining valid until expiry.
- **Role authorisation** on every write path (`protect` + `restrictTo("admin")`), including uploads.
- **Rate limiting**: 10 failed logins / 15 min per IP, 60 writes / min, 600 API requests / 15 min.
- **Input validation and sanitisation** for every payload — type/length checks, enum allow-lists,
  array normalisation, HTML and control-character stripping, Markdown scrubbed of script/iframe
  and `on*` handlers. Query searches escape regex metacharacters.
- **NoSQL injection** guarded by `express-mongo-sanitize` (strips `$` / dotted keys) plus explicit
  field allow-listing on article updates.
- **CORS** limited to `CLIENT_ORIGIN` (comma-separated allow-list), credentials enabled. Loopback
  origins are trusted in development only, never in production. A same-origin guard rejects
  cross-site state-changing requests.
- **Headers** set by Helmet, including a Content Security Policy, HSTS, `X-Frame-Options: DENY`,
  `nosniff`, a strict referrer policy and `frame-ancestors 'none'`.
- **File uploads** restricted by MIME type and extension, single file, 4 MB cap, randomised names,
  **verified by file signature** after writing (a renamed script is deleted and rejected).
- **Errors** never leak stack traces or database details in production.

Article bodies are stored as Markdown and rendered by `react-markdown` **without raw HTML**, so
stored content cannot inject markup. Raw `<script>`/`<iframe>` are stripped before storage as a
second layer.

## 9. Build and deploy

Two supported shapes:

**Single service** — Express serves the API and the built client:

```bash
npm run build            # type-check + bundle the client into client/dist
NODE_ENV=production npm start
```

**Split deployment** — React on Netlify, Express on Render, MongoDB on Atlas. This is the
recommended production shape and is documented step by step in **[DEPLOYMENT.md](DEPLOYMENT.md)**:
Atlas setup, Render environment variables, Netlify build settings, `VITE_API_URL`, cross-site
cookies, seeding the production database and a go-live checklist.

Supporting files:

| File | Purpose |
| --- | --- |
| `netlify.toml` | Frontend base/build/publish, SPA redirect, security headers and caching |
| `render.yaml` | Render blueprint: root directory, start command, health check, variables |
| `client/.env.example` | `VITE_API_URL` documentation |
| `server/.env.example` | Every API variable, with the cookie and CORS settings explained |

Requirements for any real deployment:

1. `MONGO_URI` pointing at a persistent MongoDB (the in-memory fallback is disabled in production).
2. A long random `JWT_SECRET`.
3. `CLIENT_ORIGIN` set to the public origin(s).
4. HTTPS — `Secure` cookies require TLS.
5. Change the seeded admin password before the first production seed.
6. `COOKIE_SAME_SITE=none` when the frontend and API are on different sites.

## 10. Verification performed

- `tsc --noEmit` and `vite build` pass; the initial JS bundle is code-split
  (301 kB / 95 kB gzip, with the Markdown + Prism reader and the admin desk loaded on demand).
- Seeder run against a real MongoDB instance: 62 articles inserted, 0 missing files.
- API exercised end to end: health checks, listing with filters, pagination, search, public stats,
  article detail with related/previous/next, category and tag listings, failed and successful login,
  session check, admin dashboard and list, create draft → publish → public read → delete,
  provenance enforcement for news entries (422 without a source), CORS preflight, foreign-origin
  rejection (403), and sign-out invalidation (a token replayed after logout returns 401).

## 11. Known limits

- The in-memory MongoDB is a development convenience: content resets on restart. Point
  `MONGO_URI` at a real database for persistence.
- Uploaded images are stored on local disk. Render's free filesystem is ephemeral, so covers
  uploaded there do not survive a deploy; [DEPLOYMENT.md](DEPLOYMENT.md) describes moving to
  object storage.
- There is a single administrator role (`admin`); no editorial workflow or multi-user accounts.
- News entries are added by hand through the desk — there is no feed ingestion, by design, so
  nothing is published without a verified source.
- Platform write-ups are labelled as demonstrations because they document methodology with
  redacted values rather than reproducing live solves.
