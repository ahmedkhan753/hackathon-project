from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class BookingCreate(BaseModel):
    service_id: int
    slot_start: datetime
    slot_end: datetime = Field(..., description="Must be after slot_start")

    @model_validator(mode="after")
    def slot_end_after_start(self):
        if self.slot_end <= self.slot_start:
            raise ValueError("slot_end must be after slot_start")
        return self


class BookingUpdate(BaseModel):
    status: str | None = Field(None, pattern="^(pending|confirmed|cancelled|completed)$")


class BookingResponse(BaseModel):
    id: int
    service_id: int
    seeker_id: int
    slot_start: datetime
    slot_end: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BookingWithService(BaseModel):
    id: int
    service_id: int
    seeker_id: int
    slot_start: datetime
    slot_end: datetime
    status: str
    created_at: datetime
    service_title: str
    provider_id: int

    class Config:
        from_attributes = True
