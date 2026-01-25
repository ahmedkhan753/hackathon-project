"""
Backfill script to generate embeddings for existing services
Run this after migration to populate embeddings for all existing services
"""
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.service import Service
from app.core.search_engine import search_engine
from app.core.location_engine import get_h3_index
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def backfill_embeddings():
    """Generate embeddings for all existing services"""
    db: Session = SessionLocal()
    
    try:
        # Get all services
        services = db.query(Service).all()
        logger.info(f"Found {len(services)} services to process")
        
        updated_count = 0
        for service in services:
            # Generate embedding if missing
            if not service.embedding:
                search_text = f"{service.title} {service.description or ''}"
                service.embedding = search_engine.generate_embedding(search_text)
                updated_count += 1
                logger.info(f"Generated embedding for service #{service.id}: {service.title}")
            
            # Generate H3 index if location exists but H3 missing
            if service.latitude and service.longitude and not service.h3_index:
                service.h3_index = get_h3_index(service.latitude, service.longitude)
                logger.info(f"Generated H3 index for service #{service.id}")
        
        # Commit all changes
        db.commit()
        logger.info(f"✅ Backfill complete! Updated {updated_count} services")
        
    except Exception as e:
        logger.error(f"❌ Error during backfill: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("🚀 Starting embedding backfill...")
    backfill_embeddings()
