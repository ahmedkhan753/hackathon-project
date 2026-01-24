from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users
from app.db.database import engine, Base
app = FastAPI()


@app.get("/")
async def read_root():
    return {"Hello": "World"}

app.include_router(users.router)
Base.metadata.create_all(bind=engine)