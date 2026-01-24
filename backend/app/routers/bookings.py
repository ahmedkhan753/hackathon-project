from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingResponse, status_code=201)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Seeker books a slot for a service. You cannot book your own service."""
    try:
        bk = booking_service.create(db, current_user.id, data)
        return bk
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[BookingResponse])
def list_bookings(
    as_seeker: bool = Query(True, description="Include bookings where you are the seeker"),
    as_provider: bool = Query(True, description="Include bookings on services you provide"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List your bookings (as seeker and/or as provider)."""
    return booking_service.list_for_user(db, current_user.id, as_seeker=as_seeker, as_provider=as_provider)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a booking by id. You must be the seeker or the service provider."""
    bk = booking_service.get_by_id(db, booking_id)
    if not bk:
        raise HTTPException(status_code=404, detail="Booking not found")
    if bk.seeker_id != current_user.id and bk.service.provider_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return bk


@router.patch("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    data: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update booking status. Seeker or provider can cancel; only provider can confirm or mark completed."""
    if data.status is None:
        raise HTTPException(status_code=400, detail="status is required")
    try:
        bk = booking_service.update_status(db, booking_id, current_user.id, data.status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not bk:
        raise HTTPException(status_code=404, detail="Booking not found or you cannot update it")
    return bk
