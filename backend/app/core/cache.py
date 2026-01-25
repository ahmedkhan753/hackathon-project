"""
Redis Cache Manager
Handles caching of search results for performance
"""
import redis
import json
import logging
from typing import Any, Optional
import os

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Redis cache manager for search results
    Provides sub-5ms response times for hot queries
    """
    _instance = None
    _redis_client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._redis_client is None:
            try:
                redis_host = os.getenv('REDIS_HOST', 'redis')
                redis_port = int(os.getenv('REDIS_PORT', 6379))
                
                self._redis_client = redis.Redis(
                    host=redis_host,
                    port=redis_port,
                    db=0,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                
                # Test connection
                self._redis_client.ping()
                logger.info(f"Connected to Redis at {redis_host}:{redis_port}")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Cache will be disabled.")
                self._redis_client = None
    
    def _generate_key(self, query: str, lat: float, lng: float, km: int) -> str:
        """
        Generate cache key from search parameters
        
        Format: search:{query}:{lat}:{lng}:{km}
        """
        # Round coordinates to 4 decimal places (~11m precision)
        lat_rounded = round(lat, 4)
        lng_rounded = round(lng, 4)
        
        # Normalize query (lowercase, strip whitespace)
        query_normalized = query.lower().strip()
        
        return f"search:{query_normalized}:{lat_rounded}:{lng_rounded}:{km}"
    
    def get(self, query: str, lat: float, lng: float, km: int) -> Optional[Any]:
        """
        Get cached search results
        
        Returns:
            Cached results or None if not found/expired
        """
        if not self._redis_client:
            return None
        
        try:
            key = self._generate_key(query, lat, lng, km)
            cached_data = self._redis_client.get(key)
            
            if cached_data:
                logger.info(f"Cache HIT for query: {query}")
                return json.loads(cached_data)
            
            logger.info(f"Cache MISS for query: {query}")
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    def set(
        self, 
        query: str, 
        lat: float, 
        lng: float, 
        km: int, 
        data: Any, 
        ttl: int = 300
    ) -> bool:
        """
        Cache search results
        """
        if not self._redis_client:
            return False
        
        try:
            key = self._generate_key(query, lat, lng, km)
            serialized = json.dumps(data, default=str)
            self._redis_client.setex(key, ttl, serialized)
            logger.info(f"Cached {len(data)} results for query: {query} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """
        Clear cache entries matching pattern
        
        Args:
            pattern: Redis key pattern (e.g., "search:*")
        
        Returns:
            Number of keys deleted
        """
        if not self._redis_client:
            return 0
        
        try:
            keys = self._redis_client.keys(pattern)
            if keys:
                deleted = self._redis_client.delete(*keys)
                logger.info(f"Cleared {deleted} cache entries matching: {pattern}")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return 0
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self._redis_client:
            return {"status": "disabled"}
        
        try:
            info = self._redis_client.info()
            return {
                "status": "connected",
                "used_memory": info.get('used_memory_human'),
                "total_keys": self._redis_client.dbsize(),
                "hits": info.get('keyspace_hits', 0),
                "misses": info.get('keyspace_misses', 0),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}


# Global instance
cache_manager = CacheManager()
