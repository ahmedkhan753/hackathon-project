from datetime import timezone
from sqlalchemy.orm import Session, aliased

from app.models.booking import Booking
from app.models.service import Service
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingUpdate
from app.services.payment_service import payment_service


def _overlaps(a_start, a_end, b_start, b_end) -> bool:
    # Ensure all are naive for safely comparing MySQL datetimes
    a_s = a_start.replace(tzinfo=None) if a_start.tzinfo else a_start
    a_e = a_end.replace(tzinfo=None) if a_end.tzinfo else a_end
    b_s = b_start.replace(tzinfo=None) if b_start.tzinfo else b_start
    b_e = b_end.replace(tzinfo=None) if b_end.tzinfo else b_end
    return a_s < b_e and b_s < a_e


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
        slot_start=data.slot_start.replace(tzinfo=None) if data.slot_start.tzinfo else data.slot_start,
        slot_end=data.slot_end.replace(tzinfo=None) if data.slot_end.tzinfo else data.slot_end,
        status="pending",
    )
    db.add(bk)
    db.commit()
    db.refresh(bk)
    return get_by_id(db, bk.id)


def get_by_id(db: Session, booking_id: int) -> dict | None:
    # Create aliases for the User table
    Provider = aliased(User, name="provider")
    Seeker = aliased(User, name="seeker")

    bk = db.query(Booking).join(Service).join(Provider, Service.provider_id == Provider.id).join(Seeker, Booking.seeker_id == Seeker.id).filter(Booking.id == booking_id).first()
    if not bk:
        return None

    return {
        "id": bk.id,
        "service_id": bk.service_id,
        "seeker_id": bk.seeker_id,
        "slot_start": bk.slot_start,
        "slot_end": bk.slot_end,
        "status": bk.status,
        "created_at": bk.created_at,
        "service": {
            "id": bk.service.id,
            "title": bk.service.title,
            "description": bk.service.description,
            "category": bk.service.category,
            "provider_id": bk.service.provider_id,
            "provider": {
                "id": bk.service.provider.id,
                "name": bk.service.provider.name,
                "email": bk.service.provider.email,
            }
        },
        "seeker": {
            "id": bk.seeker.id,
            "name": bk.seeker.name,
            "email": bk.seeker.email,
        }
    }


def list_for_user(db: Session, user_id: int, as_seeker: bool = True, as_provider: bool = True) -> list[dict]:
    qry = db.query(Booking).join(Service)

    if as_seeker and not as_provider:
        qry = qry.filter(Booking.seeker_id == user_id)
    elif as_provider and not as_seeker:
        qry = qry.filter(Service.provider_id == user_id)
    elif as_seeker and as_provider:
        qry = qry.filter(
            (Booking.seeker_id == user_id) | (Service.provider_id == user_id)
        )

    bookings = qry.order_by(Booking.slot_start.desc()).all()

    # Convert to dict with nested service and seeker data
    result = []
    for bk in bookings:
        booking_dict = {
            "id": bk.id,
            "service_id": bk.service_id,
            "seeker_id": bk.seeker_id,
            "slot_start": bk.slot_start,
            "slot_end": bk.slot_end,
            "status": bk.status,
            "created_at": bk.created_at,
            "service": {
                "id": bk.service.id,
                "title": bk.service.title,
                "description": bk.service.description,
                "category": bk.service.category,
                "provider_id": bk.service.provider_id,
                "provider": {
                    "id": bk.service.provider.id,
                    "name": bk.service.provider.name,
                    "email": bk.service.provider.email,
                }
            },
            "seeker": {
                "id": bk.seeker.id,
                "name": bk.seeker.name,
                "email": bk.seeker.email,
            }
        }
        result.append(booking_dict)
    return result


def update_status(db: Session, booking_id: int, user_id: int, status: str) -> dict | None:
    # Fetch the actual ORM object for updates
    bk = db.query(Booking).filter(Booking.id == booking_id).first()
    if not bk:
        return None

    # Check current status
    if bk.status in ("cancelled", "completed"):
        raise ValueError(f"Cannot change status of a {bk.status} booking")

    # Check permissions
    svc = bk.service
    is_seeker = bk.seeker_id == user_id
    is_provider = svc.provider_id == user_id
    if not is_seeker and not is_provider:
        return None

    # Update status based on permissions
    if status == "cancelled":
        if is_seeker or is_provider:
            bk.status = "cancelled"
            db.commit()
            db.refresh(bk)
            return get_by_id(db, booking_id)
    elif status == "confirmed" and is_provider:
        bk.status = "confirmed"
        db.commit()
        db.refresh(bk)
        return get_by_id(db, booking_id)
    elif status == "completed" and is_provider:
        bk.status = "completed"
        db.commit()
        db.refresh(bk)

        # Trigger payment processing when booking is completed
        try:
            payment_service.process_payment(db, booking_id, user_id)
        except Exception as e:
            # Log the error but don't fail the booking completion
            print(f"Payment processing failed for booking {booking_id}: {e}")

        return get_by_id(db, booking_id)

    return None
