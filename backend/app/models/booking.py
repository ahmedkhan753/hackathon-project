from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    seeker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_start = Column(DateTime(timezone=True), nullable=False)
    slot_end = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending, confirmed, cancelled, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    service = relationship("Service", back_populates="bookings")
    seeker = relationship("User", backref="bookings_made")
    messages = relationship("ChatMessage", back_populates="booking")
    review = relationship("Review", back_populates="booking", uselist=False)
    payment = relationship("Payment", back_populates="booking", uselist=False)
