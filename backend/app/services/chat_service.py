from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.chat_message import ChatMessage
from app.models.booking import Booking
from app.models.service import Service


def save_message(db: Session, booking_id: int, sender_id: int, recipient_id: int, message: str, message_type: str = "text"):
    """
    Save a chat message to the database
    """
    db_message = ChatMessage(
        booking_id=booking_id,
        sender_id=sender_id,
        recipient_id=recipient_id,
        message=message,
        message_type=message_type
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_messages_for_booking(db: Session, booking_id: int, user_id: int, limit: int = 50, offset: int = 0):
    """
    Get chat messages for a booking, ensuring user has access
    """
    # Verify user is part of the booking
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")

    if booking.seeker_id != user_id and booking.service.provider_id != user_id:
        raise ValueError("Access denied: User is not part of this booking")

    # Get messages
    messages = db.query(ChatMessage).filter(
        ChatMessage.booking_id == booking_id
    ).order_by(ChatMessage.created_at.desc()).limit(limit).offset(offset).all()

    return messages[::-1]  # Reverse to get chronological order


def get_unread_count_for_user(db: Session, user_id: int) -> int:
    """
    Get total unread message count for a user across all their bookings
    """
    # Count unread messages in those bookings where user is not the sender
    from sqlalchemy import select
    booking_ids_select = select(Booking.id).filter(
        or_(Booking.seeker_id == user_id, Booking.service.has(Service.provider_id == user_id))
    )
    
    count = db.query(ChatMessage).filter(
        and_(
            ChatMessage.booking_id.in_(booking_ids_select),
            ChatMessage.sender_id != user_id,
            ChatMessage.is_read == False
        )
    ).count()

    return count


def mark_messages_read(db: Session, booking_id: int, user_id: int) -> int:
    """
    Mark all messages in a booking as read for a user
    """
    # Verify user is part of the booking
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")

    if booking.seeker_id != user_id and booking.service.provider_id != user_id:
        raise ValueError("Access denied: User is not part of this booking")

    # Update messages where user is not the sender
    updated_count = db.query(ChatMessage).filter(
        and_(
            ChatMessage.booking_id == booking_id,
            ChatMessage.sender_id != user_id,
            ChatMessage.is_read == False
        )
    ).update({"is_read": True})

    db.commit()
    return updated_count
