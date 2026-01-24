from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, services, bookings
from app.db.database import engine, Base

app = FastAPI(
    title="Neighbourly API",
    description="""
## Authentication

Protected routes (e.g. `POST /services`, `GET /bookings`) require a **Bearer token**.

### Swagger "Authorize" (lock icon)
1. **Login first**: Open `POST /login` → **Try it out** → send `username` and `password` → **Execute**.
2. Copy the `access_token` value from the response (the long string, without quotes).
3. Click **Authorize** (lock icon).
4. Paste **only the token** (not "Bearer ") into the **Value** field → **Authorize** → **Close**.

All subsequent requests will include `Authorization: Bearer <token>` automatically.

### cURL
1. `curl -X POST "http://localhost:8000/login" -H "Content-Type: application/x-www-form-urlencoded" -d "username=YOUR_USER&password=YOUR_PASS"`
2. Copy `access_token` from the JSON response.
3. Add header: `Authorization: Bearer <access_token>` to each protected request.
    """,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root():
    return {"Hello": "World"}


app.include_router(users.router)
app.include_router(services.router)
app.include_router(bookings.router)
Base.metadata.create_all(bind=engine)