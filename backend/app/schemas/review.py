from datetime import datetime
from pydantic import BaseModel, Field

class ReviewCreate(BaseModel):
    booking_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: str | None = None

class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    provider_id: int
    seeker_id: int
    rating: float
    comment: str | None
    created_at: datetime

    class Config:
        from_attributes = True
