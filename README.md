# Basar AI

Multi-brand social image generator. Built with Next.js 14, FastAPI, and Supabase.

## Quick Start (Docker)

Get the app running in 5 steps. You need **Docker**, **Node.js/npm** (for the Supabase CLI in step 4), a **Supabase project**, and a **Clerk** application.

### 1. Clone and enter the repo

```bash
git clone <repo-url> && cd basarai
```

### 2. Get your Supabase and Clerk credentials

From the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings → API**, grab:

| Value | Where to find it |
|-------|-----------------|
| **Project URL** | Settings → API (e.g. `https://xxxxx.supabase.co`) |
| **Secret key** | Settings → API → Project API keys (reveal) |

Supabase is the database, storage, and vault. Auth is Clerk. From the [Clerk Dashboard](https://dashboard.clerk.com) → **API Keys** (Frontend API host is under Advanced):

| Value | Where to find it |
|-------|-----------------|
| **Publishable key** | `pk_test_…` / `pk_live_…` |
| **Secret key** | `sk_test_…` / `sk_live_…` |
| **Issuer** | `https://<frontend-api-host>` |

### 3. Create your env files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

Edit **`backend/.env`** — fill in Supabase and Clerk values:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ISSUER=https://<frontend-api-host>
CLERK_AUTHORIZED_PARTIES=http://localhost:3001,http://localhost:3000
```

`CLERK_AUTHORIZED_PARTIES` must include the origin the browser actually uses (`http://localhost:3001` under `make up`, `http://localhost:3000` for `npm run dev`, the HTTPS origin in production).

Edit **`frontend/.env.local`**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/brands
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/brands
```

### 4. Set up the database

Install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started), then log in and push migrations:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

> **Where is my project ref?** It's in your Supabase Dashboard URL: `supabase.com/dashboard/project/<project-ref>`

Then create the **`brand-assets`** storage bucket in the Dashboard → **Storage → New bucket**:
- **Public bucket**: Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/webp`

In Clerk, set sign-in `/login`, sign-up `/signup`, and after-sign-in / after-sign-up `/brands`. Add the session token claim `{ "email": "{{user.primary_email_address}}" }` so the backend can read the email.

### 5. Build and run

```bash
make up
```

The app is now running at **http://localhost:3001**.

Check health: `make health` | View logs: `make logs`

> **Port**: The app is mapped to host port `3001` by default. Override with `make up APP_PORT=<port>`. If you change the port, also update `CORS_ORIGINS` in `backend/.env` to match.

---

## Local Development (without Docker)

For active development with hot-reload, run the backend and frontend directly.

### Prerequisites

- Node.js 18+
- Python 3.13+
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

### Backend

```bash
cd backend
cp .env.example .env   # fill in Supabase and Clerk credentials (see step 2 above)
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in Clerk + Supabase URL (see step 2 above)
npm install
npm run dev
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make build` | Build Docker image |
| `make up` | Build and run container |
| `make down` | Stop and remove container |
| `make logs` | Tail container logs |
| `make restart` | Restart container |
| `make shell` | Shell into running container |
| `make health` | Check container health |
| `make clean` | Remove container and image |
| `make dev` | Show local dev instructions |
| `make dev-backend` | Run backend locally |
| `make dev-frontend` | Run frontend locally |
| `make lint` | Lint backend + frontend |
| `make test` | Run backend tests |

See [docs/docker.md](docs/docker.md) for full Docker/deployment details.
