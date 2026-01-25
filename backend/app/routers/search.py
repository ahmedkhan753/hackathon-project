"""
Search API Router
Semantic + Location-Aware Search Endpoint
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
import logging

from app.dependencies import get_db
from app.schemas.service import ServiceList
from app.core.search_engine import search_engine
from app.core.location_engine import get_nearby_h3_cells
from app.core.cache import cache_manager
from app.models.service import Service as ServiceModel

router = APIRouter(prefix="/search", tags=["search"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[ServiceList])
async def search_services(
    q: str = Query(..., min_length=1, description="Search query"),
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude"),
    km: int = Query(5, ge=1, le=50, description="Radius in kilometers"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
    db: "Session" = Depends(get_db)
):
    """
    🔍 Semantic + Location-Aware Search
    
    This endpoint combines:
    1. **Redis Cache** - Sub-5ms response for hot queries
    2. **H3 Geospatial** - Constant-time location filtering
    3. **ML Embeddings** - Semantic understanding of queries
    4. **Cosine Similarity** - Relevance ranking
    
    Examples:
    - "math tutor" → finds "Physics & Algebra Teacher"
    - "bike repair" → finds "Motorcycle Mechanic"
    - "house clean" → finds "Home Cleaning Services"
    
    Args:
        q: Search query (semantic understanding)
        lat: User latitude
        lng: User longitude
        km: Search radius (1-50 km)
        limit: Max results to return
    
    Returns:
        List of services ranked by semantic relevance with scores
    """
    logger.info(f"Search request: query='{q}', location=({lat}, {lng}), radius={km}km")
    
    # 1️⃣ Check cache first
    cached_results = cache_manager.get(q, lat, lng, km)
    if cached_results:
        logger.info("Returning cached results")
        return cached_results[:limit]
    
    # 2️⃣ Get nearby H3 cells for location filtering
    nearby_cells = get_nearby_h3_cells(lat, lng, km)
    logger.info(f"Found {len(nearby_cells)} H3 cells in {km}km radius")
    
    # 3️⃣ Query database with H3 filter
    # Only fetch services in nearby cells (massive performance boost)
    services_query = db.query(ServiceModel).filter(
        ServiceModel.status == "active",
        ServiceModel.h3_index.in_(nearby_cells)
    )
    
    services = services_query.all()
    logger.info(f"Found {len(services)} services in location")
    
    if not services:
        return []
    
    # 4️⃣ Convert to dicts for semantic ranking
    service_dicts = []
    for service in services:
        service_dict = {
            "id": service.id,
            "provider_id": service.provider_id,
            "title": service.title,
            "description": service.description,
            "category": service.category,
            "status": service.status,
            "latitude": service.latitude,
            "longitude": service.longitude,
            "created_at": service.created_at,
            "embedding": service.embedding,
            "score": None  # Will be populated by search engine
        }
        service_dicts.append(service_dict)
    
    # 5️⃣ Rank by semantic similarity
    ranked_services = search_engine.rank_by_similarity(q, service_dicts)
    logger.info(f"Ranked {len(ranked_services)} services by relevance")
    
    # 6️⃣ Take top results
    top_results = ranked_services[:limit]
    
    # 7️⃣ Cache results (5 minute TTL)
    cache_manager.set(q, lat, lng, km, top_results, ttl=300)
    
    # Log top result for debugging
    if top_results:
        first_score = top_results[0].get('score')
        score_str = f"{first_score:.3f}" if first_score is not None else "N/A"
        logger.info(f"Top result: '{top_results[0]['title']}' (score: {score_str})")
    
    return top_results


@router.get("/stats")
async def get_search_stats():
    """
    Get search engine statistics
    
    Returns cache stats and model info for monitoring
    """
    return {
        "cache": cache_manager.get_stats(),
        "model": search_engine.get_model_info()
    }
