from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.reputation_service import reputation_service

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("/", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a review for a completed booking"""
    try:
        return reputation_service.add_review(
            db=db,
            booking_id=review_data.booking_id,
            seeker_id=current_user.id,
            rating=review_data.rating,
            comment=review_data.comment
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/top")
def get_top_providers(
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Get top rated providers"""
    return reputation_service.get_top_providers(db, limit)

@router.get("/stats/{provider_id}")
def get_provider_stats(
    provider_id: int,
    db: Session = Depends(get_db)
):
    """Get reputation stats for a provider"""
    return reputation_service.calculate_provider_score(provider_id, db)
