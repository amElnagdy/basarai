---
title: Basarai
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 3000
---

# Basar AI

Multi-brand social image generator. Built with Next.js 14, FastAPI, and Supabase.

## Quick Start (Docker)

Get the app running in 5 steps. You need **Docker**, **Node.js/npm** (for the Supabase CLI in step 4), and a **Supabase project**.

### 1. Clone and enter the repo

```bash
git clone <repo-url> && cd basarai
```

### 2. Get your Supabase credentials

From the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings → API**, grab:

| Value | Where to find it |
|-------|-----------------|
| **Project URL** | Settings → API (e.g. `https://xxxxx.supabase.co`) |
| **Publishable key** | Settings → API → Project API keys |
| **Secret key** | Settings → API → Project API keys (reveal) |

### 3. Create your env files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

Edit **`backend/.env`** — fill in Supabase values:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Edit **`frontend/.env.local`** — fill in URL and publishable key:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
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

Finally, configure auth redirects in the Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add `http://localhost:3000/auth/confirm`

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
cp .env.example .env   # fill in Supabase credentials (see step 2 above)
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in Supabase credentials (see step 2 above)
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
