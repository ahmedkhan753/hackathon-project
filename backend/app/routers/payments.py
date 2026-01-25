from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.payment_service import payment_service
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/process", response_model=PaymentResponse)
def process_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process payment for a completed booking"""
    try:
        return payment_service.process_payment(db, data.booking_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/booking/{booking_id}")
def get_payment_for_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get payment details for a specific booking"""
    payment = payment_service.get_payment_for_booking(db, booking_id, current_user.id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.get("/history")
def get_payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get payment history for the current user"""
    return payment_service.get_payment_history(db, current_user.id)
