from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    booking = relationship("Booking", back_populates="review")
    provider = relationship("User", foreign_keys=[provider_id])
    seeker = relationship("User", foreign_keys=[seeker_id])
