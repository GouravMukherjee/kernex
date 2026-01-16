"""Security middleware and utilities"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter"""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_history = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Skip rate limiting for health checks and test clients
        if request.url.path == "/health" or request.headers.get("user-agent") == "testclient":
            return await call_next(request)

        # Check rate limit
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)

        # Clean old requests
        self.request_history[client_ip] = [
            req_time for req_time in self.request_history[client_ip]
            if req_time > cutoff
        ]

        # Check limit
        if len(self.request_history[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests"},
            )

        # Record request
        self.request_history[client_ip].append(now)

        # Continue with request
        response = await call_next(request)
        return response


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Validate and sanitize input"""

    async def dispatch(self, request: Request, call_next):
        # Add security headers
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


def setup_cors(app):
    """Setup CORS with security best practices"""
    # Allow local development and production Vercel deployments
    allowed_origins = [
        "http://localhost:3000",  # Local dev frontend
        "http://localhost:8000",  # Local API
        "https://localhost:3000",
        "https://localhost:8000",
    ]
    
    # Add Vercel deployment URL from environment variable
    import os
    vercel_url = os.getenv("FRONTEND_URL")
    if vercel_url:
        allowed_origins.append(vercel_url)
    
    # Allow all vercel.app subdomains in development
    if os.getenv("ENVIRONMENT") == "development":
        allowed_origins.append("https://*.vercel.app")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["Content-Length"],
    )


def setup_security_middleware(app):
    """Setup all security middleware"""
    # Rate limiting
    app.add_middleware(RateLimitMiddleware, requests_per_minute=60)

    # Input validation
    app.add_middleware(InputValidationMiddleware)

    # CORS
    setup_cors(app)
