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

    with engine.connect() as conn:
        # Check existing columns
        result = conn.execute(text("DESCRIBE services"))
        existing_columns = [row[0] for row in result.fetchall()]
        logger.info(f"Existing columns: {existing_columns}")

        # Check existing indexes
        result = conn.execute(text("SHOW INDEX FROM services"))
        existing_indexes = [row[2] for row in result.fetchall()]
        logger.info(f"Existing indexes: {existing_indexes}")

        migrations = []

        # Add price column if not exists
        if 'price' not in existing_columns:
            migrations.append("ALTER TABLE services ADD COLUMN price DOUBLE NOT NULL DEFAULT 0")

        # Add location columns if not exist
        if 'latitude' not in existing_columns:
            migrations.append("ALTER TABLE services ADD COLUMN latitude DOUBLE")
        if 'longitude' not in existing_columns:
            migrations.append("ALTER TABLE services ADD COLUMN longitude DOUBLE")
        if 'h3_index' not in existing_columns:
            migrations.append("ALTER TABLE services ADD COLUMN h3_index VARCHAR(20)")

        # Add embedding column if not exists
        if 'embedding' not in existing_columns:
            migrations.append("ALTER TABLE services ADD COLUMN embedding JSON")

        # Add index on h3_index if not exists
        if 'idx_h3_index' not in existing_indexes:
            migrations.append("CREATE INDEX idx_h3_index ON services(h3_index)")

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
