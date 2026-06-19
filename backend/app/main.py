from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from uuid import uuid4

from app.config import settings
from app.routers import admin, brands, generations, health, keys, kit, me


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(
    title="Basar AI API",
    description="API for Basar AI - Brand Management Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(me.router, tags=["account"])
app.include_router(admin.router)
app.include_router(brands.router)
app.include_router(keys.router)
app.include_router(kit.router)
app.include_router(generations.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail,
            headers=getattr(exc, "headers", None),
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    errors = exc.errors()
    name_error = next(
        (
            error.get("msg")
            for error in errors
            if any(part == "name" for part in error.get("loc", []))
        ),
        None,
    )
    message = name_error or "Invalid request payload"
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "request_id": str(uuid4()),
            }
        },
    )


@app.get("/")
async def root():
    return {
        "message": "Basar AI API",
        "version": "0.1.0",
        "status": "running",
    }
