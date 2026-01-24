from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.booking import Booking
from app.models.service import Service
from app.schemas.booking import BookingCreate, BookingUpdate


def _overlaps(a_start, a_end, b_start, b_end) -> bool:
    return a_start < b_end and b_start < a_end


def create(db: Session, seeker_id: int, data: BookingCreate) -> Booking:
    svc = db.query(Service).filter(Service.id == data.service_id).first()
    if not svc:
        raise ValueError("Service not found")
    if svc.status != "active":
        raise ValueError("Service is not available for booking")
    if svc.provider_id == seeker_id:
        raise ValueError("You cannot book your own service")

    for b in db.query(Booking).filter(
        Booking.service_id == data.service_id,
        Booking.status.in_(["pending", "confirmed"]),
    ).all():
        if _overlaps(b.slot_start, b.slot_end, data.slot_start, data.slot_end):
            raise ValueError("This slot overlaps with an existing booking")

    bk = Booking(
        service_id=data.service_id,
        seeker_id=seeker_id,
        slot_start=data.slot_start,
        slot_end=data.slot_end,
        status="pending",
    )
    db.add(bk)
    db.commit()
    db.refresh(bk)
    return bk


def get_by_id(db: Session, booking_id: int) -> Booking | None:
    return db.query(Booking).filter(Booking.id == booking_id).first()


def list_for_user(db: Session, user_id: int, *, as_seeker: bool = True, as_provider: bool = True) -> list[Booking]:
    qry = db.query(Booking).join(Service)
    cond = []
    if as_seeker:
        cond.append(Booking.seeker_id == user_id)
    if as_provider:
        cond.append(Service.provider_id == user_id)
    if not cond:
        return []
    qry = qry.filter(or_(*cond)).order_by(Booking.slot_start.desc())
    return qry.all()


def update_status(db: Session, booking_id: int, user_id: int, status: str) -> Booking | None:
    bk = get_by_id(db, booking_id)
    if not bk:
        return None
    if bk.status in ("cancelled", "completed"):
        raise ValueError(f"Cannot change status of a {bk.status} booking")
    svc = bk.service
    is_seeker = bk.seeker_id == user_id
    is_provider = svc.provider_id == user_id
    if not is_seeker and not is_provider:
        return None

    if status == "cancelled":
        if is_seeker or is_provider:
            bk.status = "cancelled"
            db.commit()
            db.refresh(bk)
            return bk
    if status == "confirmed" and is_provider:
        bk.status = "confirmed"
        db.commit()
        db.refresh(bk)
        return bk
    if status == "completed" and is_provider:
        bk.status = "completed"
        db.commit()
        db.refresh(bk)
        return bk
    return None
