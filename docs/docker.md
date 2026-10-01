# Docker Deployment Guide

This guide covers building, running, and deploying the Basar AI container image.

## Overview

The application is packaged as a single Docker container containing:
- **Frontend**: Next.js 14 (App Router) with standalone output
- **Backend**: FastAPI on Python 3.13
- **Target Platform**: Bunny Magic container hosting

The container exposes port 3000 (frontend). The backend runs internally on localhost:8000 and is not accessible from outside the container.

## Prerequisites

- Docker installed (version 20.10+)
- Supabase project credentials
- Container registry access (for deployment)

## Build

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... \
  -t basarai:latest .
```

### Build Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (baked into client JS for next/image Storage URLs) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (baked into client JS) |

**Important**: Build arguments are inlined into the JavaScript bundle at build time. They cannot be changed at runtime for client-side code. For multiple environments, build separate images per environment.

## Run

```bash
docker run -d \
  --name basarai \
  -p 3001:3000 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SECRET_KEY=sb_secret_... \
  -e CLERK_SECRET_KEY=sk_test_... \
  -e CLERK_ISSUER=https://<frontend-api-host> \
  -e CLERK_AUTHORIZED_PARTIES=http://localhost:3001,http://localhost:3000 \
  basarai:latest
```

The application is available at `http://localhost:3001`.

### Runtime Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Supabase project URL (DB, storage, vault) |
| `SUPABASE_SECRET_KEY` | Yes | — | Server-side Supabase key (bypasses RLS) |
| `CLERK_SECRET_KEY` | Yes | — | Clerk secret key (Next.js server) |
| `CLERK_ISSUER` | Yes | — | Clerk Frontend API host as `https://…` (JWKS is `{CLERK_ISSUER}/.well-known/jwks.json`) |
| `CLERK_AUTHORIZED_PARTIES` | Yes | — | Comma-separated browser origins allowed as JWT `azp` |
| `STORAGE_BUCKET` | No | `brand-assets` | Storage bucket name |
| `ADMIN_EMAILS` | No | (empty) | Comma-separated operator emails |
| `CORS_ORIGINS` | No | `http://localhost:3001,...` | Comma-separated allowed origins (must match the host port you expose) |

**Security**: Never commit runtime secrets to version control. Use environment files or secret management systems.

## Verify

### Check Container Health

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' basarai

# View detailed health check logs
docker inspect --format='{{json .State.Health}}' basarai | jq
```

### Test Backend Internally

The backend is not accessible from outside the container. Test from inside:

```bash
docker exec basarai python3 -c \
  "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"
```

Expected output: `{"status":"healthy","timestamp":"..."}`

### View Logs

```bash
# All logs (both services interleaved)
docker logs -f basarai

# Recent logs

docker logs --tail 50 basarai
```

## Stop

```bash
# Graceful shutdown (sends SIGTERM)
docker stop basarai

# Remove stopped container
docker rm basarai
```

Graceful shutdown completes within 10 seconds. Both services receive termination signals and clean up properly.

## Bunny Magic Deployment

### 1. Push to Container Registry

```bash
# Tag for your registry
docker tag basarai:latest your-registry.com/basarai:latest

# Push
docker push your-registry.com/basarai:latest
```

### 2. Configure on Bunny Magic

1. Create a new container deployment
2. Set the image reference to your pushed image
3. Configure port: **3000**
4. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_ISSUER`
   - `CLERK_AUTHORIZED_PARTIES` (include the HTTPS origin the browser uses)
   - `STORAGE_BUCKET` (optional)
   - `ADMIN_EMAILS` (optional)
5. Configure health check:
   - Endpoint: Internal (Docker HEALTHCHECK is used)
   - Start period: 40 seconds
6. Deploy

Rebuild the image when the Clerk publishable key changes (dev instance vs prod instance).

Bunny Magic handles HTTPS termination. The container serves HTTP only.

## Troubleshooting

### Missing Environment Variables

**Symptom**: Container exits immediately with error message.

**Cause**: Required environment variables not set.

**Solution**: The entrypoint script lists all missing variables. Set all required vars:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_ISSUER`
- `CLERK_AUTHORIZED_PARTIES`

### Backend Fails to Start

**Symptom**: Container logs show "Backend failed to start within 30 seconds".

**Cause**: Backend cannot connect to Supabase.

**Solution**:
1. Verify `SUPABASE_URL` is accessible from the container
2. Check that `SUPABASE_SECRET_KEY` is valid
3. Ensure network connectivity to Supabase

### Frontend Build Fails

**Symptom**: Docker build fails during `npm run build`.

**Cause**: Missing or invalid `NEXT_PUBLIC_*` build arguments.

**Solution**: Ensure both build args are provided:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Container Marked Unhealthy

**Symptom**: `docker inspect` shows `unhealthy` status.

**Cause**: Health check failing for backend or frontend.

**Solution**:
1. Check logs: `docker logs basarai`
2. Verify backend health internally: `docker exec basarai python3 -c "..."`
3. Check frontend responds: `curl http://localhost:3000`
4. Both services must return HTTP 200 for healthy status

### Graceful Shutdown Timeout

**Symptom**: Container takes longer than 10 seconds to stop.

**Cause**: Process not responding to SIGTERM.

**Solution**: This is rare. If it occurs, the container will be force-killed after the timeout. Check logs for stuck processes.

## Architecture Notes

- **Backend binding**: `127.0.0.1:8000` (internal-only)
- **Frontend binding**: `0.0.0.0:3000` (publicly accessible, mapped to host port `3001` by default)
- **API proxy**: Next.js rewrites `/api/*` to `http://127.0.0.1:8000/*`
- **Process management**: `tini` as PID 1 + bash entrypoint script
- **Image size**: ~560MB (Python 3.13 slim + Node.js 20)
- **No secrets in layers**: Only `NEXT_PUBLIC_*` vars are in image (publishable keys)
- **JWT verification**: Clerk session JWTs, RS256 via PyJWKClient. Issuer is `CLERK_ISSUER`; JWKS is `{CLERK_ISSUER}/.well-known/jwks.json`. `azp` must be listed in `CLERK_AUTHORIZED_PARTIES`. A 401 `INVALID_TOKEN` with a well-formed token usually means issuer/key/azp mismatch across Clerk instances.
