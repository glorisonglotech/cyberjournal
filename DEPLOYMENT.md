# Production deployment guide

This guide takes the Glorison Cyber Journal from a local checkout to a live
deployment using the architecture the project is prepared for:

| Layer | Host | What runs there |
| --- | --- | --- |
| Frontend | Netlify | The Vite/React build in `client/dist` |
| Backend | Render | The Express API in `server/` |
| Database | MongoDB Atlas | Articles, categories, tags, admin user |

You need three free accounts and about 45 minutes. No step requires paid plans.

---

## 0. Before you start

1. Push the repository to GitHub. Netlify and Render deploy from a repository. If this
   folder is not a git repository yet:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

   `.gitignore` already excludes `node_modules`, `dist`, `.env` files and uploads, so no secret is
   committed.
2. Confirm the build works locally:

```bash
npm run setup
npm run build
```

3. Generate a JWT secret and keep it somewhere safe:

```bash
openssl rand -hex 48
```

> [!IMPORTANT]
> `server/.env` is ignored by git and must never be committed. Production values
> are entered in the Render dashboard, not in the repository.

---

## A. MongoDB Atlas

### A1. Create the account and cluster

1. Go to <https://www.mongodb.com/cloud/atlas/register> and create an account.
2. Choose **Create a deployment** → **M0 Free**.
3. Pick the provider and region closest to your Render region (for example AWS
   `us-east-1` if Render is in Oregon/US).
4. Name the cluster (for example `cyber-journal`) and create it. Provisioning
   takes a few minutes.

### A2. Create a database user

1. In the cluster, open **Database Access** → **Add New Database User**.
2. Choose **Password** authentication.
3. Username: `journal-api`.
4. Password: use **Autogenerate** and copy it somewhere safe. Avoid `@`, `:` and
   `/` in the password, or URL-encode them later.
5. Privileges: **Read and write to any database** is sufficient for this app.
6. Create the user.

### A3. Configure network access

1. Open **Network Access** → **Add IP Address**.
2. Render's free tier does not publish stable egress IPs on every plan, so the
   practical option is `0.0.0.0/0` (allow from anywhere).
3. Add a comment such as `Render API` and confirm.

> [!WARNING]
> `0.0.0.0/0` is broad. It is acceptable because the database still requires a
> username and password, but for a hardened setup move the API to a plan with
> static egress IPs and allow-list only those addresses.

### A4. Get the connection string

1. Cluster → **Connect** → **Drivers**.
2. Copy the `mongodb+srv://…` string.
3. Replace `<password>` with the database user's password and add the database
   name before the query string:

```text
mongodb+srv://journal-api:PASSWORD@cluster0.xxxxx.mongodb.net/glorison-journal?retryWrites=true&w=majority
```

Keep this string private. It is the `MONGO_URI` value for Render.

---

## B. Backend on Render

### B1. Create the web service

1. Sign in at <https://render.com> with GitHub.
2. **New** → **Web Service** → connect the repository.
3. Configure:

| Setting | Value |
| --- | --- |
| Name | `cyber-journal-api` |
| Region | Same region as the Atlas cluster if possible |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Instance type | Free |

The repository also contains `render.yaml`, which can create the service with
these settings automatically (**New** → **Blueprint**).

### B2. Environment variables

In **Environment** add:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20` |
| `MONGO_URI` | the Atlas connection string from A4 |
| `JWT_SECRET` | the value from `openssl rand -hex 48` |
| `JWT_EXPIRES_IN` | `7d` |
| `COOKIE_SAME_SITE` | `none` |
| `CLIENT_ORIGIN` | your Netlify URL, e.g. `https://cyber-journal.netlify.app` |
| `ADMIN_EMAIL` | the administrator email you want |
| `ADMIN_USERNAME` | the administrator username |
| `ADMIN_PASSWORD` | a strong password, used only when seeding |

Do not set `PORT`; Render injects it.

> [!NOTE]
> `COOKIE_SAME_SITE=none` is required because the frontend and API are on
> different sites. The API automatically marks the cookie `Secure`, which works
> because Render serves HTTPS.

### B3. Deploy and verify

1. **Create Web Service** and wait for the first deploy to finish.
2. Open the service URL and check the health endpoint:

```bash
curl https://cyber-journal-api.onrender.com/api/health
# {"status":"ok","uptime":…,"timestamp":"…"}
```

3. If the build fails, read the deploy log. The most common causes are a wrong
   root directory (`server`, not the repository root) and a missing `MONGO_URI`.

### B4. Seed the database once

The API never seeds automatically in production. Create the administrator and the
content library with Render's shell:

1. Open the service → **Shell**.
2. Run:

```bash
npm run seed
```

You should see:

```text
[seed] connected (persistent)
[seed] 62 inserted · 0 already present
```

Re-running it is safe: existing slugs are skipped, so edits made in the admin desk
are preserved. If the shell is unavailable on your plan, run the seeder from your
machine with the production URI:

```bash
MONGO_URI="mongodb+srv://…" ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="…" \
  npm --prefix server run seed
```

### B5. Test the API

```bash
# Public listing
curl https://cyber-journal-api.onrender.com/api/articles?limit=2

# Stats used by the homepage
curl https://cyber-journal-api.onrender.com/api/articles/stats

# Sign in (save the cookie)
curl -i -c cookies.txt -X POST https://cyber-journal-api.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"you@example.com","password":"YOUR_PASSWORD"}'

# Authenticated request
curl -b cookies.txt https://cyber-journal-api.onrender.com/api/auth/me
```

---

## C. Frontend on Netlify

### C1. Create the site

1. Sign in at <https://app.netlify.com> with GitHub.
2. **Add new site** → **Import an existing project** → choose the repository.
3. Netlify reads `netlify.toml`, which already sets:

```toml
[build]
  base = "client"
  command = "npm run build"
  publish = "dist"
```

If you configure manually instead, use those same three values.

### C2. Set the API URL

In **Site configuration** → **Environment variables** add:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://cyber-journal-api.onrender.com/api` |

Rules:

- Include `/api`.
- No trailing slash.
- `https://`, not `http://`.

Then trigger **Deploys → Trigger deploy → Clear cache and deploy site**. Vite
bakes environment variables at build time, so a rebuild is required after any
change.

### C3. Deploy and verify

1. Open the Netlify URL.
2. The homepage should list articles and show counts.
3. Open **/admin/login** and sign in with the seeded administrator.
4. If the homepage shows "Cannot reach the journal API", check:
   - `VITE_API_URL` is present and includes `/api`.
   - The deploy was rebuilt after setting it.
   - The Render service is awake (free instances sleep; the first request can take
     up to a minute).

### C4. SPA routing

`netlify.toml` includes the redirect that sends every unknown path to
`/index.html`. Without it, refreshing `/writeups/…` would return a 404. If you
deploy without `netlify.toml`, add a redirect rule with:

- From: `/*`
- To: `/index.html`
- Status: `200`

---

## D. Final production checks

Work through this list once the three services are live.

| Check | How | Expected |
| --- | --- | --- |
| API health | `GET /api/health` | `200` with `status: ok` |
| Database | homepage counts | Non-zero totals |
| CORS | load the site, open DevTools → Network | No CORS errors |
| Login | `/admin/login` | Redirects to `/admin` |
| Session persists | refresh the admin page | Still signed in |
| Cross-site cookie | DevTools → Application → Cookies | `SameSite=None; Secure` |
| Create article | admin → new article → publish | Appears on the public site |
| Upload | upload a cover image | Image renders (see D2) |
| Logout | sign out, then reload `/admin` | Redirected to login |
| No localhost | search the built bundle | No `localhost:5000` references |
| Secrets | inspect the Netlify bundle | No `JWT_SECRET` or `MONGO_URI` |

### D1. Common production problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| CORS error in console | `CLIENT_ORIGIN` does not match exactly | Set the exact Netlify origin, no trailing slash, redeploy Render |
| Login succeeds but `/admin` redirects back | Cookie blocked cross-site | Confirm `COOKIE_SAME_SITE=none` and HTTPS on both sides |
| 401 on every admin request | Old token after a logout | Sign in again; tokens issued before logout are invalidated |
| Images broken after upload | Uploads live on Render's ephemeral disk | See D2 |
| First request slow | Free instance cold start | Expected; keep the health check enabled |
| 404 on refresh of a nested route | Missing SPA redirect | Restore the redirect in `netlify.toml` |
| `MONGO_URI is required in production` | Variable missing | Add it in Render, then redeploy |

### D2. Uploads on Render

Render's filesystem is ephemeral on free plans: uploaded images disappear on the
next deploy or restart. Two options:

1. **Simple:** re-upload covers after a deploy. Acceptable while the library uses
   repository-hosted SVG covers.
2. **Durable:** move uploads to object storage (Cloudflare R2, AWS S3, Cloudinary)
   and change `upload.controller.js` to return the storage URL. The upload
   middleware already validates file type and size, so only the storage layer
   changes.

Article text, categories and tags are stored in MongoDB Atlas, so they persist
regardless.

---

## E. Environment variables

### Backend (Render)

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` enables secure cookies, disables stack traces and blocks the in-memory database |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Signs session tokens; minimum 32 characters |
| `JWT_EXPIRES_IN` | No | Token lifetime, default `7d` |
| `COOKIE_SAME_SITE` | Yes for split hosting | `none` for Netlify → Render, `lax` for same-site |
| `COOKIE_DOMAIN` | No | Only when sharing a parent domain |
| `CLIENT_ORIGIN` | Yes | Comma-separated allowed frontend origins |
| `ADMIN_EMAIL` | Seed only | Administrator email created by `npm run seed` |
| `ADMIN_USERNAME` | Seed only | Administrator username |
| `ADMIN_PASSWORD` | Seed only | Administrator password; change before first seed |
| `PORT` | No | Injected by Render |

### Frontend (Netlify)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes for split hosting | Full API base including `/api` |

### Local development (`server/.env` and `client/.env`)

Copy `server/.env.example` to `server/.env`. Leave `MONGO_URI` empty to use the
disposable in-memory database, or point it at a local `mongod`. Copy
`client/.env.example` to `client/.env` only if you want the client to call an API
on another port; otherwise the Vite proxy handles it.

---

## F. Operating the site

### Publishing content

1. Sign in at `/admin/login`.
2. **Articles → New article**.
3. Choose the type; the metadata fields adapt (platform and difficulty for
   write-ups, level for tutorials, source for news).
4. Write in Markdown, or paste an existing document. Callouts use
   `> [!NOTE]`, collapsible sections use a ` ```collapse Title ` fence.
5. **Save draft** keeps it private; **Publish** makes it public and stamps the
   publication date.

### Adding repository-managed content

The 62 seeded entries live in `server/services/content/markdown/`. To add another:

1. Add the Markdown file.
2. Add one row to `server/services/content/catalog/tutorials.js` or `writeups.js`.
3. Run `npm run seed` (locally or in the Render shell). Only new slugs are
   inserted; existing articles are not overwritten.

### Backups

Atlas M0 does not include automated backups. Export periodically:

```bash
mongodump --uri="mongodb+srv://…" --out=backup-$(date +%F)
```

---

## G. Security checklist for go-live

- [ ] `JWT_SECRET` is at least 32 random characters and unique to production.
- [ ] `ADMIN_PASSWORD` was changed from the local default before seeding.
- [ ] `CLIENT_ORIGIN` lists only your real frontend origins.
- [ ] `NODE_ENV=production` on Render.
- [ ] Atlas network access limited as far as your plan allows.
- [ ] Atlas database user has read/write only, not admin.
- [ ] No `.env` file, secret or connection string is committed.
- [ ] HTTPS is enabled on both services (default on Netlify and Render).
- [ ] Login rate limiting is active (10 failed attempts per 15 minutes).
- [ ] You have signed out once and confirmed the old session is rejected.
