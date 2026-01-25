from datetime import datetime
from pydantic import BaseModel

class ServiceBrief(BaseModel):
    id: int
    title: str
    category: str | None

class BookingBrief(BaseModel):
    id: int
    service_id: int
    slot_start: datetime
    slot_end: datetime
    service: ServiceBrief

class PaymentBase(BaseModel):
    booking_id: int

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    amount: float
    currency: str
    status: str
    transaction_id: str | None
    payment_method: str | None
    created_at: datetime
    updated_at: datetime
    booking: BookingBrief | None = None

    class Config:
        from_attributes = True
