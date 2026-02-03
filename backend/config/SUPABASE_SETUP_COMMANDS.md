Supabase setup — commands and steps

Overview
- This file lists recommended commands and steps to create/configure a Supabase project, apply the SQL schema at `backend/config/supabase-schema.sql`, and update your local env files for both backend and frontend.

Prerequisites
- You must have a Supabase account. If you don't, create one: https://app.supabase.com/
- Install `psql` (Postgres CLI) or use Supabase dashboard SQL editor.
- (Optional) Install Supabase CLI for convenience.

Install Supabase CLI (optional)
- macOS (Homebrew):
  brew install supabase/tap/supabase
- Windows (Scoop):
  scoop install supabase
- npm (cross-platform, if available):
  npm install -g supabase

Login with Supabase CLI (optional)
- supabase login

Create or select a Supabase project
- Easiest: use the Supabase web dashboard and create a new project.
- Note the project ref (project id shown in the URL) and keys from Dashboard → Settings → API.
  - `Project URL` (example: https://xyzabc.supabase.co)
  - `anon` public key
  - `service_role` key (keep secret)

Apply schema (recommended options)
Option A — Use `psql` + DB connection string (recommended for applying large SQL files):
1. Get the DB connection string from Supabase Dashboard → Settings → Database → Connection string (use the full postgres URL).
2. Run locally (replace <CONN_STRING> with the provided postgres URL):

```bash
# Example (Linux / macOS / PowerShell compatible if quoting correctly):
psql "<CONN_STRING>" -f backend/config/supabase-schema.sql
```

Option B — Use Supabase dashboard SQL editor:
1. Open Supabase Dashboard → SQL → New query
2. Paste contents of `backend/config/supabase-schema.sql` and run.

Option C — Use Supabase CLI (migrations flow)
1. Initialize migrations in repo (if you want migration workflow):

```bash
supabase init
# Create migration file and copy SQL content into migrations/<timestamp>_init.sql
supabase db push
```

Set environment variables (local)
- Backend `.env` (backend/.env): update these values from Supabase Dashboard → Settings → API

```
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

- Frontend `.env.local` (fitness-app-frontend/.env.local):

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

Notes:
- Never commit `SUPABASE_SERVICE_ROLE_KEY` to source control. Treat it as a secret.
- `NEXT_PUBLIC_` vars are public in the browser; do not put service role key there.

Windows PowerShell quick set example (temporary for session):
```powershell
$env:SUPABASE_URL = 'https://<PROJECT_REF>.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY = '<service_role_key>'
# To persist, edit backend/.env file instead
```

Verify connectivity & test auth endpoints
1. Start backend:
```bash
cd backend
npm run dev
```
2. Test register endpoint (example):
```bash
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","password":"TestPass123"}' -i
```
3. Test login endpoint:
```bash
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"TestPass123"}' -i
```

Troubleshooting
- DNS errors (getaddrinfo ENOTFOUND): verify `SUPABASE_URL` in `backend/.env` is correct and reachable. Try:
  - nslookup <PROJECT_REF>.supabase.co 8.8.8.8
  - curl -I https://<PROJECT_REF>.supabase.co/
- If DNS returns "Non-existent domain", confirm project ref is correct in the Supabase dashboard.
- If `psql` cannot connect, ensure the connection string is correct and your IP is allowed if you enabled network restrictions.

Security & best practices
- Use the `service_role` key only on the server (backend). Use `anon` key on the frontend.
- Rotate keys in the Supabase dashboard if you suspect leakage.
- Use RLS and policies for production access control.

If you want, I can:
- Fill `backend/.env` and `fitness-app-frontend/.env.local` with the correct values if you paste them here (I will mark service role key as sensitive and avoid printing it back).
- Run the `psql` or `curl` checks from your environment (I can run commands in your terminal if you confirm).

