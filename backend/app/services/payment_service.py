"""
Payment Service
Handles payment processing and transaction management
"""
import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.payment import Payment
from app.models.service import Service
from app.services.audit_service import audit_service


class PaymentService:
    """
    Handles payment processing for completed bookings
    """

    def _map_to_dict(self, payment: Payment) -> dict:
        """Helper to map Payment model + nested objects to dict for response"""
        return {
            "id": payment.id,
            "booking_id": payment.booking_id,
            "amount": payment.amount,
            "currency": payment.currency,
            "status": payment.status,
            "transaction_id": payment.transaction_id,
            "payment_method": payment.payment_method,
            "created_at": payment.created_at,
            "updated_at": payment.updated_at,
            "booking": {
                "id": payment.booking.id,
                "service_id": payment.booking.service_id,
                "slot_start": payment.booking.slot_start,
                "slot_end": payment.booking.slot_end,
                "service": {
                    "id": payment.booking.service.id,
                    "title": payment.booking.service.title,
                    "category": payment.booking.service.category,
                }
            }
        }

    def process_payment(self, db: Session, booking_id: int, user_id: int) -> dict:
        """
        Process payment for a completed booking
        """
        # Get the booking with joined service
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError("Booking not found")

        if booking.status != "completed":
            raise ValueError("Booking must be completed before payment can be processed")

        # Check if payment already exists
        existing_payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
        if existing_payment:
            raise ValueError("Payment already processed for this booking")

        # Get service price
        service = booking.service
        if not service.price or service.price <= 0:
            raise ValueError("Service does not have a valid price")

        # Create payment record
        payment = Payment(
            booking_id=booking_id,
            amount=service.price,
            status="completed",
            transaction_id=str(uuid.uuid4())
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        # Log the payment in audit trail
        audit_service.log_payment_processed(
            db=db,
            user_id=user_id,
            booking_id=booking_id,
            amount=service.price,
            transaction_id=payment.transaction_id
        )

        return self._map_to_dict(payment)

    def get_payment_for_booking(self, db: Session, booking_id: int) -> Optional[dict]:
        """
        Get payment details for a specific booking
        """
        payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
        if not payment:
            return None
        return self._map_to_dict(payment)

    def get_payment_history(self, db: Session, user_id: int) -> list[dict]:
        """
        Get payment history for a user (as seeker or provider)
        """
        # Get payments where user is seeker
        seeker_payments = db.query(Payment).join(Booking).filter(
            Booking.seeker_id == user_id
        ).all()

        # Get payments where user is provider
        provider_payments = db.query(Payment).join(Booking).join(Service).filter(
            Service.provider_id == user_id
        ).all()

        # Combine and combine (using IDs to avoid duplicates)
        p_map = {}
        for p in seeker_payments:
            p_map[p.id] = self._map_to_dict(p)
        for p in provider_payments:
            p_map[p.id] = self._map_to_dict(p)

        # Return sorted by created_at DESC
        result = list(p_map.values())
        result.sort(key=lambda x: x['created_at'], reverse=True)
        return result


# Global instance
payment_service = PaymentService()
