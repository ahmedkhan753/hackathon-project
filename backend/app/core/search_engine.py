"""
Semantic Search Engine using Google Gemini API
Generates embeddings and computes semantic similarity using Cloud Intelligence
"""
import google.generativeai as genai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Optional
import logging
import os

logger = logging.getLogger(__name__)


class SearchEngine:
    """
    Cloud-powered semantic search engine
    Uses Google's Gemini text-embedding-004 model
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Only initialize once
        if not hasattr(self, '_initialized'):
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                logger.warning("GEMINI_API_KEY not found in environment. Semantic search will be disabled.")
                self._enabled = False
            else:
                genai.configure(api_key=api_key)
                # We use the latest high-performance embedding model
                self._model_id = "models/text-embedding-004"
                self._enabled = True
                logger.info(f"Search engine initialized with {self._model_id}")
            self._initialized = True
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate semantic embedding for text using Google Gemini
        
        Args:
            text: Input text (service title + description)
        
        Returns:
            768-dimensional embedding vector (Gemini standard)
        """
        if not self._enabled:
            logger.error("Search engine disabled: Missing API Key")
            return [0.0] * 768

        if not text or not text.strip():
            return [0.0] * 768
        
        try:
            # Use task_type="retrieval_document" for storing indexable content
            result = genai.embed_content(
                model=self._model_id,
                content=text,
                task_type="retrieval_document",
                title="Service Listing"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Gemini Embedding Error: {e}")
            return [0.0] * 768
    
    def rank_by_similarity(
        self, 
        query: str, 
        services: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Rank services by semantic similarity to query
        """
        if not services or not self._enabled:
            return services
        
        try:
            # Generate query embedding with task_type="retrieval_query"
            query_result = genai.embed_content(
                model=self._model_id,
                content=query,
                task_type="retrieval_query"
            )
            query_vec = np.array([query_result['embedding']])
            
            # Extract service embeddings
            service_embeddings = []
            for service in services:
                # Store embeddings in local DB as we retrieve them to save on API calls
                service_embeddings.append(service.get('embedding') or [0.0] * 768)
            
            service_vecs = np.array(service_embeddings)
            
            # Compute cosine similarity
            similarities = cosine_similarity(query_vec, service_vecs)[0]
            
            # Add scores to services
            for i, service in enumerate(services):
                service['score'] = float(similarities[i])
            
            # Sort by score (descending)
            ranked = sorted(services, key=lambda x: x['score'], reverse=True)
            return ranked
            
        except Exception as e:
            logger.error(f"Gemini Ranking Error: {e}")
            # FALLBACK: If AI fails, assign 1.0 score so search still works (just not ranked)
            for service in services:
                service['score'] = 1.0
            return services
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the model"""
        return {
            "model_name": "Gemini text-embedding-004",
            "provider": "Google Cloud",
            "embedding_dimension": 768,
            "status": "Ready" if self._enabled else "Disabled (Missing API Key)"
        }


# Global instance
search_engine = SearchEngine()
