FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

RUN npm run build

FROM python:3.13-slim AS backend-builder

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.13-slim AS runtime

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs tini && \
    apt-get purge -y curl && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

RUN useradd --create-home appuser

WORKDIR /app

COPY --from=backend-builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=backend-builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

COPY backend/app /app/backend/app

COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

COPY scripts/container-entrypoint.sh /app/scripts/container-entrypoint.sh
RUN chmod +x /app/scripts/container-entrypoint.sh

RUN mkdir -p /app/frontend/.next/cache && \
    chown -R appuser:appuser /app/frontend/.next/cache && \
    npm install --prefix /app/frontend sharp

# (Removed build args from runtime stage since Next.js expects them at build time or runtime via actual env vars)

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python3 -c "import os,urllib.request,sys;bp=os.environ.get('BACKEND_PORT','8000');fp=os.environ.get('FRONTEND_PORT','3000');r1=urllib.request.urlopen(f'http://localhost:{bp}/health');r2=urllib.request.urlopen(f'http://localhost:{fp}');sys.exit(0 if r1.status==200 and r2.status==200 else 1)"

USER appuser

EXPOSE 3000

ENTRYPOINT ["tini", "--"]
CMD ["/app/scripts/container-entrypoint.sh"]
