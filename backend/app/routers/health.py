import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import Base, get_db
from app.models import Venue  # noqa: F401 - register all tables

router = APIRouter(prefix="/health", tags=["health"])
logger = logging.getLogger(__name__)


@router.get("/live")
def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
def ready(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    try:
        for table in Base.metadata.sorted_tables:
            db.execute(select(table.c.id).limit(1)).first()
    except SQLAlchemyError:
        logger.warning("Database readiness check failed")
        raise HTTPException(status_code=503, detail="Database is not ready") from None
    return {"status": "ready"}
