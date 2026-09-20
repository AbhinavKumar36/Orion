"""
Main FastAPI application entry point for ORION.
AI-Powered Cyber Threat Intelligence & Digital Trust Platform.
"""
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import get_risk_config, risk_config_loader
from backend.app.core.database import check_db_health, init_db
from backend.app.api.endpoints.incidents import router as incidents_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation: Load and validate risk configuration
    risk_config_loader.load()
    # Initialize SQLite database schema
    init_db()
    yield


app = FastAPI(
    title="ORION Cyber Threat Intelligence API",
    description="AI-Powered Cyber Threat Intelligence & Digital Trust Platform (CYBERGUARD PS09)",
    version="1.2.0",
    lifespan=lifespan,
)

app.include_router(incidents_router, prefix="/api/incidents", tags=["Incidents"])

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_metadata(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Request-Id"] = request_id
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred",
                "details": str(exc),
                "request_id": req_id,
            }
        },
    )


@app.get("/api/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    db_health = check_db_health()
    cfg = get_risk_config()
    is_healthy = db_health.get("connected", False) and db_health.get("schema_initialized", False)

    return {
        "status": "ok" if is_healthy else "degraded",
        "service": "orion-backend",
        "risk_config_version": cfg.get("version", "unknown"),
        "database": db_health,
    }


@app.get("/api/system/info", tags=["System"])
async def system_info() -> Dict[str, Any]:
    cfg = get_risk_config()
    return {
        "product_name": "ORION",
        "description": "AI-Powered Cyber Threat Intelligence & Digital Trust Platform",
        "specification_version": "3.3",
        "contract_version": "1.2",
        "risk_config_version": cfg.get("version"),
        "layers": ["human", "technology"],
        "supported_modules": [
            "phishing",
            "impersonation",
            "media",
            "authentication",
            "system_activity",
        ],
        "demo_mode": True,
        "offline_mode": True,
    }
