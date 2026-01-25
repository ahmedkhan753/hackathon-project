from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    price = Column(Float, nullable=False)  # Price per hour in USD
    status = Column(String(20), default="active", nullable=False)
    
    # Location fields for geospatial search
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    h3_index = Column(String(20), nullable=True, index=True)
    
    # Semantic search field
    embedding = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    provider = relationship("User", backref="services_provided")
    bookings = relationship("Booking", back_populates="service", cascade="all, delete-orphan")

