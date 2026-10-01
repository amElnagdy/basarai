# basarai Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-08

## Active Technologies
- Dockerfile, Bash (entrypoint); modifies Python 3.13 backend + TypeScript/Next.js 14 frontend configs + Docker (multi-stage build), tini (PID 1 init), Node.js 20, Python 3.13, uvicorn (002-dockerization)
- N/A (no database changes) (002-dockerization)
- Python 3.13 (backend), TypeScript 5.x (frontend) + FastAPI 0.109+, Pydantic 2.x, Pillow 10+ (new — for logo resize), supabase-py 2.3+, Next.js 14 (App Router), @supabase/ssr, shadcn/ui, Tailwind CSS, zod, react-hook-form (003-brand-crud)
- Supabase (PostgreSQL) for data, Supabase Storage (`brand-assets` bucket) for logos (003-brand-crud)
- Python 3.13 (backend), TypeScript 5.x (frontend) + FastAPI 0.109+, Pydantic 2.x, supabase-py 2.3+, httpx (async HTTP for provider validation), Next.js 14 (App Router), @supabase/ssr, shadcn/ui, Tailwind CSS, zod, react-hook-form (004-provider-keys)
- Supabase PostgreSQL (`provider_keys` table, already migrated), Supabase Vault (encrypted key storage via RPC wrappers) (004-provider-keys)
- Python 3.13 (backend), TypeScript 5.x / Next.js 14 (frontend) + FastAPI + Pydantic 2.x (backend); shadcn/ui, Tailwind CSS, react-hook-form (not used for wizard), Lucide React, zod (frontend) (005-brand-kit)
- Supabase PostgreSQL — `brand_kits` table (already migrated) (005-brand-kit)
- Python 3.13 (backend), TypeScript 5.x / Next.js 14 App Router (frontend) + FastAPI 0.109+, Pydantic 2.x, httpx (async HTTP), Pillow 10+ (post-process + watermark), **`google-genai` (NEW — official Google Gen AI SDK for Gemini image calls)**, `supabase-py` (Storage + DB + Vault RPC); shadcn/ui, Tailwind, react-hook-form, zod, lucide-react (frontend) (006-generation)
- Supabase PostgreSQL — `generations` table (already migrated); Supabase Storage `brand-assets` bucket (public) — PNGs stored at `brands/{brandId}/generations/{generationId}.png`; Supabase Vault (read-only in this feature) — provider API keys resolved by `vault_secret_id` (006-generation)

- Python 3.13 (backend), TypeScript 5.x (frontend) + FastAPI 0.109+, Next.js 14 (App Router), @supabase/ssr, @supabase/supabase-js, PyJWT, supabase-py, shadcn/ui, Tailwind CSS (001-foundation)

## Project Structure

```text
backend/
frontend/
supabase/
```

## Commands

```bash
# Backend
cd backend && pytest && ruff check .

# Frontend
cd frontend && npm run dev
```

## Code Style

Python 3.13 (backend), TypeScript 5.x (frontend): Follow standard conventions

## Recent Changes
- 006-generation: Added Python 3.13 (backend), TypeScript 5.x / Next.js 14 App Router (frontend) + FastAPI 0.109+, Pydantic 2.x, httpx (async HTTP), Pillow 10+ (post-process + watermark), **`google-genai` (NEW — official Google Gen AI SDK for Gemini image calls)**, `supabase-py` (Storage + DB + Vault RPC); shadcn/ui, Tailwind, react-hook-form, zod, lucide-react (frontend)
- 005-brand-kit: Added Python 3.13 (backend), TypeScript 5.x / Next.js 14 (frontend) + FastAPI + Pydantic 2.x (backend); shadcn/ui, Tailwind CSS, react-hook-form (not used for wizard), Lucide React, zod (frontend)
- 004-provider-keys: Added Python 3.13 (backend), TypeScript 5.x (frontend) + FastAPI 0.109+, Pydantic 2.x, supabase-py 2.3+, httpx (async HTTP for provider validation), Next.js 14 (App Router), @supabase/ssr, shadcn/ui, Tailwind CSS, zod, react-hook-form


<!-- MANUAL ADDITIONS START -->

## Workflow

- Feature specs live in `specs/<feature-id>/` (e.g., `specs/001-foundation/spec.md`)
- Use speckit slash commands (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`) for the full feature lifecycle
- Feature branches follow `NNN-feature-name` convention (e.g., `002-dockerization`)
- Always run `/speckit.analyze` after generating tasks to check cross-artifact consistency

## Supabase

- Remote Supabase only — no local Supabase. Connect via `supabase link --project-ref <ref>`, push migrations with `supabase db push`
- Migrations: `supabase/migrations/`; config: `supabase/config.toml`

### CRITICAL: API Key Migration (2026-03)

Supabase deprecated legacy key names. This project uses the NEW naming:
- **Backend**: `SUPABASE_SECRET_KEY` (was `SUPABASE_SERVICE_ROLE_KEY`) — the only backend key needed for DB, storage, and vault
- **Frontend**: `NEXT_PUBLIC_SUPABASE_URL` stays (next/image remotePatterns for Storage). Do NOT add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — auth is Clerk, not Supabase Auth
- **Removed entirely**: `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — dead code, do NOT re-add
- **JWT verification**: Clerk session JWTs, RS256 via `PyJWKClient`. Issuer is `CLERK_ISSUER`; JWKS is `{CLERK_ISSUER}/.well-known/jwks.json`. `azp` must be in `CLERK_AUTHORIZED_PARTIES`. Do not use HS256 or a shared secret
- Docs: https://supabase.com/docs/guides/api/api-keys | https://clerk.com/docs/backend-requests/handling/manual-jwt
- `get_user_client()` was deleted (dead code) — only `get_service_client()` exists

## Deployment

- Target platform: Bunny Magic (container hosting)
- Single-container strategy: both frontend (Next.js) and backend (FastAPI) in one image
- HTTPS termination handled by platform; container serves HTTP only
- Docker commands: `make up` (build+run), `make logs`, `make down`, `make health`
- Build args (baked into JS): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Runtime env (via `--env-file backend/.env`): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CLERK_SECRET_KEY`, `CLERK_ISSUER`, `CLERK_AUTHORIZED_PARTIES`

## Code Review

- CodeRabbit is configured for PR reviews — expect automated review comments on PRs
- Address CodeRabbit feedback in dedicated fix commits (e.g., `fix: address CodeRabbit review feedback`)

<!-- MANUAL ADDITIONS END -->
