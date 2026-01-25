from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine
from app.models import user, service, booking, review, audit_log, chat_message, payment
from app.routers import users, search, bookings, services, chat, payments, reviews

# Create database tables
user.Base.metadata.create_all(bind=engine)
service.Base.metadata.create_all(bind=engine)
booking.Base.metadata.create_all(bind=engine)
review.Base.metadata.create_all(bind=engine)
audit_log.Base.metadata.create_all(bind=engine)
chat_message.Base.metadata.create_all(bind=engine)
payment.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Neighbourly API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(search.router)
app.include_router(bookings.router)
app.include_router(services.router)
app.include_router(chat.router)
app.include_router(payments.router)
app.include_router(reviews.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Neighbourly API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
