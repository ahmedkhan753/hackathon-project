from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    email: EmailStr

    class Config:
        from_attributes = True  # For SQLAlchemy

class Token(BaseModel):
    access_token: str
    token_type: str