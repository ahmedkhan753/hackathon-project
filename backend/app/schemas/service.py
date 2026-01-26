from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class ServiceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    price: float = Field(..., gt=0, description="Price per hour in USD")
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)


class ServiceUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    status: str | None = Field(None, pattern="^(active|inactive)$")


class ServiceResponse(BaseModel):
    id: int
    provider_id: int
    title: str
    description: str | None
    category: str | None
    price: float
    status: str
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    updated_at: datetime | None
    
    # Search score (only populated in search results)
    score: float | None = None

    class Config:
        from_attributes = True


class ServiceList(BaseModel):
    id: int
    provider_id: int
    title: str
    description: str | None
    category: str | None
    status: str
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    
    # Search score (only populated in search results)
    score: float | None = None

    class Config:
        from_attributes = True


class ServiceDetailedResponse(BaseModel):
    id: int
    provider_id: int
    title: str
    description: str | None
    category: str | None
    price: float
    status: str
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    updated_at: datetime | None
    provider: UserResponse | None = None

    class Config:
        from_attributes = True
