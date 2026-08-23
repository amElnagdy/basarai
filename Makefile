SHELL := /bin/bash

.PHONY: build up down logs restart shell health clean dev dev-backend dev-frontend lint test

IMAGE_NAME ?= basarai
CONTAINER_NAME ?= basarai-app
APP_PORT ?= 3001

# Docker
build:
	@source frontend/.env.local 2>/dev/null || true; \
	[ -n "$${NEXT_PUBLIC_SUPABASE_URL}" ] || { echo "ERROR: NEXT_PUBLIC_SUPABASE_URL not set (check frontend/.env.local or shell env)"; exit 1; }; \
	[ -n "$${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" ] || { echo "ERROR: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not set (check frontend/.env.local or shell env)"; exit 1; }; \
	docker build \
		--build-arg NEXT_PUBLIC_SUPABASE_URL=$${NEXT_PUBLIC_SUPABASE_URL} \
		--build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} \
		-t $(IMAGE_NAME):latest .

up: build
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(APP_PORT):3000 \
		--env-file backend/.env \
		$(IMAGE_NAME):latest

down:
	-docker rm -f $(CONTAINER_NAME) 2>/dev/null || true

logs:
	docker logs -f $(CONTAINER_NAME)

restart: down up

shell:
	docker exec -it $(CONTAINER_NAME) bash

health:
	@docker inspect --format='{{.State.Health.Status}}' $(CONTAINER_NAME) 2>/dev/null || echo "Container not running"

clean:
	-docker rm -f $(CONTAINER_NAME) 2>/dev/null || true
	-docker rmi $(IMAGE_NAME):latest 2>/dev/null

# Local development (no Docker)
dev-backend:
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Run in two terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

# Quality
lint:
	cd backend && ruff check .
	cd frontend && npm run lint

test:
	cd backend && pytest
