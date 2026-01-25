from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.db.database import engine, Base
from app.routers import users, services, bookings, search as search_router
from app.core.search_engine import search_engine
from app.core.cache import cache_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Neighbourly API",
    description="Hyper-local marketplace with semantic search",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(search_router.router)


@app.on_event("startup")
async def startup_event():
    """Initialize search engine on startup"""
    logger.info("🚀 Starting Neighbourly API...")
    logger.info("📊 Initializing search engine...")
    
    # This loads the ML model info (Cloud API)
    _ = search_engine.get_model_info()
    logger.info("✅ Search engine ready")
    
    # Test cache connection
    cache_stats = cache_manager.get_stats()
    logger.info(f"💾 Cache status: {cache_stats.get('status', 'unknown')}")


@app.get("/")
def read_root():
    return {
        "message": "Neighbourly API",
        "version": "2.0.0",
        "features": [
            "Semantic Search (ML-powered)",
            "Geospatial Intelligence (H3)",
            "Redis Caching",
            "User Authentication",
            "Service Marketplace",
            "Booking Management"
        ]
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "search_engine": search_engine.get_model_info(),
        "cache": cache_manager.get_stats()
    }