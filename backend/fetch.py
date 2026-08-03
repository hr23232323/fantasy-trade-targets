"""Retired data-refresh route.

The original proof of concept scraped a third-party rankings page. That path is
intentionally disabled. Production V1 reads the commercially permitted Tradyr
public API through the Next.js server route in frontend/src/app/api/market.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("/")
def retired_refresh_route():
    raise HTTPException(
        status_code=410,
        detail="Legacy refresh retired. Market data is served by the licensed frontend adapter.",
    )
