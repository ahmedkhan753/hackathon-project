"""
Chat Router
WebSocket endpoints for real-time messaging
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.dependencies import get_db, get_current_user
from app.core.chat_manager import manager
from app.services.chat_service import get_messages_for_booking, get_unread_count_for_user, mark_messages_read
from app.models.user import User
from app.models.booking import Booking

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.websocket("/ws/{booking_id}")
async def chat_websocket(
    websocket: WebSocket,
    booking_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time chat in a booking
    """
    try:
        # Authenticate user from token
        try:
            from app.dependencies import get_current_user_ws
            current_user = await get_current_user_ws(token, db)
        except Exception as e:
            logger.warning(f"WebSocket authentication failed: {e}")
            await websocket.close(code=1008)  # Policy violation
            return

        # Verify user is part of the booking
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            await websocket.close(code=1003)  # Unsupported data
            return

        valid_participants = {booking.seeker_id, booking.service.provider_id}
        if current_user.id not in valid_participants:
            await websocket.close(code=1008)  # Policy violation
            return

        # Connect to chat room
        await manager.connect(websocket, current_user.id, booking_id)

        try:
            while True:
                # Receive message
                data = await websocket.receive_json()

                # Handle the message
                await manager.handle_message(data, current_user.id, booking_id, db)

        except WebSocketDisconnect:
            manager.disconnect(current_user.id, booking_id)

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011)  # Internal error
        except:
            pass


@router.get("/messages/{booking_id}")
async def get_chat_messages(
    booking_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get chat messages for a booking
    """
    try:
        messages = get_messages_for_booking(
            db=db,
            booking_id=booking_id,
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )

        # Convert to response format
        message_list = []
        for msg in messages:
            message_list.append({
                "id": msg.id,
                "booking_id": msg.booking_id,
                "sender_id": msg.sender_id,
                "recipient_id": msg.recipient_id,
                "message": msg.message,
                "message_type": msg.message_type,
                "is_read": msg.is_read,
                "timestamp": msg.created_at.isoformat()
            })

        return {"messages": message_list}

    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/unread")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get total unread message count for current user
    """
    count = get_unread_count_for_user(db, current_user.id)
    return {"unread_count": count}


@router.post("/mark-read/{booking_id}")
async def mark_messages_read(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all messages in a booking as read for current user
    """
    try:
        updated_count = mark_messages_read(
            db=db,
            booking_id=booking_id,
            user_id=current_user.id
        )
        return {"updated_count": updated_count}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
