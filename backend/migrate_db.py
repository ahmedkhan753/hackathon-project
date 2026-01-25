"""
Database migration script to add search-related columns
Run this after updating the codebase to add new fields to existing services table
"""
from sqlalchemy import text
from app.db.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_database():
    """Add search-related columns to services table"""
    
    migrations = [
        # Add location columns
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS latitude DOUBLE",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS longitude DOUBLE",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS h3_index VARCHAR(20)",
        
        # Add embedding column
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS embedding JSON",
        
        # Add index on h3_index for fast lookups
        "CREATE INDEX IF NOT EXISTS idx_h3_index ON services(h3_index)",
    ]
    
    with engine.connect() as conn:
        for migration_sql in migrations:
            try:
                logger.info(f"Executing: {migration_sql}")
                conn.execute(text(migration_sql))
                conn.commit()
                logger.info("✅ Success")
            except Exception as e:
                logger.error(f"❌ Error: {e}")
                # Continue with other migrations
    
    logger.info("🎉 Migration complete!")


if __name__ == "__main__":
    migrate_database()
