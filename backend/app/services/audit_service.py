"""
Audit Service
Maintains immutable logs of all critical actions for security and compliance
"""
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.dependencies import get_current_user
from fastapi import Request


class AuditService:
    """
    Logs all critical actions with full context for audit trails
    """

    @staticmethod
    def log_action(
        db: Session,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: int,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Create an audit log entry for a critical action
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=json.dumps(old_values) if old_values else None,
            new_values=json.dumps(new_values) if new_values else None,
            notes=notes,
            ip_address=ip_address,
            user_agent=user_agent
        )

        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)

        return audit_log

    @staticmethod
    def log_booking_status_change(
        db: Session,
        user_id: int,
        booking_id: int,
        old_status: str,
        new_status: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Log booking status changes with full context
        """
        return AuditService.log_action(
            db=db,
            user_id=user_id,
            action="booking_status_change",
            resource_type="booking",
            resource_id=booking_id,
            old_values={"status": old_status},
            new_values={"status": new_status},
            notes=f"Booking status changed from {old_status} to {new_status}",
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def log_service_creation(
        db: Session,
        user_id: int,
        service_id: int,
        service_data: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Log service creation with full service details
        """
        return AuditService.log_action(
            db=db,
            user_id=user_id,
            action="service_created",
            resource_type="service",
            resource_id=service_id,
            new_values=service_data,
            notes="New service listing created",
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def log_payment_processed(
        db: Session,
        user_id: int,
        booking_id: int,
        amount: float,
        transaction_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Log payment processing for audit and compliance
        """
        return AuditService.log_action(
            db=db,
            user_id=user_id,
            action="payment_processed",
            resource_type="booking",
            resource_id=booking_id,
            new_values={
                "amount": amount,
                "transaction_id": transaction_id,
                "currency": "USD"
            },
            notes=f"Payment of ${amount} processed for booking {booking_id}",
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def get_audit_trail(
        db: Session,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        user_id: Optional[int] = None,
        limit: int = 100
    ) -> list[AuditLog]:
        """
        Retrieve audit logs with optional filtering
        """
        query = db.query(AuditLog)

        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if resource_id:
            query = query.filter(AuditLog.resource_id == resource_id)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        return query.order_by(AuditLog.created_at.desc()).limit(limit).all()


# Global instance
audit_service = AuditService()
