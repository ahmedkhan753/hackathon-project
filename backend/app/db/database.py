from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
RAW_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/neighbourly")

# Ensure we use the pymysql driver for Aiven/Render compatibility
# and only replace if it's the bare 'mysql://' prefix.
if RAW_URL and RAW_URL.startswith("mysql://"):
    DATABASE_URL = RAW_URL.replace("mysql://", "mysql+pymysql://", 1)
else:
    DATABASE_URL = RAW_URL

# Aiven requires SSL for its MySQL instances. 
# We pass connect_args to ensure the driver uses a secure handshake.
engine = create_engine(
    DATABASE_URL,
    connect_args={"ssl": {"ssl_mode": "REQUIRED"}}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()