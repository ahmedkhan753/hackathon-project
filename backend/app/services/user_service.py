from sqlalchemy.orm import Session
from app.models.user import User
from app.dependencies import ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash, verify_password, create_access_token
from datetime import timedelta
from app.schemas.user import UserCreate
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

def create_user(db: Session, user: UserCreate):
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise ValueError("Email already registered")
    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise ValueError("Username already registered")

    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, name=user.name, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def login_user(db: Session, form_data: OAuth2PasswordRequestForm):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}