from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine
from app.routers import health, places


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Migrations and sample seeding are explicit commands, never startup side effects.
    yield
    engine.dispose()


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(health.router, prefix="/api/v1")
app.include_router(places.router, prefix="/api/v1")
