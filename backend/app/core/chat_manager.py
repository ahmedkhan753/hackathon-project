"""
WebSocket Chat Manager
Handles real-time messaging between seekers and providers
"""
import asyncio
from typing import Dict, List
from fastapi import WebSocket
import json
import logging
from datetime import datetime

from app.services.chat_service import save_message

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time chat
    """

    def __init__(self):
        # Maps user_id to their active WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}
        # Maps booking_id to list of connected user_ids for that booking
        self.booking_connections: Dict[int, List[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, booking_id: int):
        """
        Accept WebSocket connection and register user
        """
        await websocket.accept()

        # Store connection
        self.active_connections[user_id] = websocket

        # Add to booking room
        if booking_id not in self.booking_connections:
            self.booking_connections[booking_id] = []
        if user_id not in self.booking_connections[booking_id]:
            self.booking_connections[booking_id].append(user_id)

        logger.info(f"User {user_id} connected to booking {booking_id} chat")

    def disconnect(self, user_id: int, booking_id: int):
        """
        Remove user from connections
        """
        # Remove from active connections
        if user_id in self.active_connections:
            del self.active_connections[user_id]

        # Remove from booking room
        if booking_id in self.booking_connections and user_id in self.booking_connections[booking_id]:
            self.booking_connections[booking_id].remove(user_id)
            if not self.booking_connections[booking_id]:
                del self.booking_connections[booking_id]

        logger.info(f"User {user_id} disconnected from booking {booking_id} chat")

    async def send_personal_message(self, message: dict, user_id: int):
        """
        Send message to specific user
        """
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                # Remove broken connection
                await self.disconnect(user_id, message.get("booking_id", 0))

    async def broadcast_to_booking(self, message: dict, booking_id: int, exclude_user_id: int = None):
        """
        Send message to all users in a booking chat room
        """
        if booking_id not in self.booking_connections:
            return

        for user_id in self.booking_connections[booking_id]:
            if user_id != exclude_user_id:
                await self.send_personal_message(message, user_id)

    async def handle_message(self, message: dict, sender_id: int, booking_id: int, db):
        """
        Process incoming chat message
        """
        try:
            message_type = message.get("type", "text")
            content = message.get("content", "").strip()

            if not content:
                return

            # Save message to database
            saved_message = save_message(
                db=db,
                booking_id=booking_id,
                sender_id=sender_id,
                recipient_id=message.get("recipient_id"),
                message=content,
                message_type=message_type
            )

            # Prepare broadcast message
            broadcast_message = {
                "id": saved_message.id,
                "booking_id": booking_id,
                "sender_id": sender_id,
                "message": content,
                "message_type": message_type,
                "timestamp": saved_message.created_at.isoformat(),
                "type": "chat_message"
            }

            # Broadcast to all users in the booking
            await self.broadcast_to_booking(broadcast_message, booking_id, exclude_user_id=sender_id)

        except Exception as e:
            logger.error(f"Error handling chat message: {e}")
            # Send error back to sender
            error_message = {
                "type": "error",
                "message": "Failed to send message",
                "timestamp": datetime.utcnow().isoformat()
            }
            await self.send_personal_message(error_message, sender_id)


# Global instance
manager = ConnectionManager()
