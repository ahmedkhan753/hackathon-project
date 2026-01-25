from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)  # Amount in USD
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending, completed, failed, refunded
    transaction_id = Column(String(255), unique=True, nullable=True)  # External payment processor ID
    payment_method = Column(String(50), nullable=True)  # e.g., "stripe", "paypal"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    booking = relationship("Booking", back_populates="payment")
