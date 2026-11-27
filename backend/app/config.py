import os
from typing import List
from dotenv import load_dotenv

# Load .env file from backend directory if present
load_dotenv()

class Settings:
    PROJECT_NAME: str = "PortSentinel API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database path: Resolve relative to backend directory so it is persistent
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DEFAULT_DB_PATH: str = os.path.join(BASE_DIR, "portsentinel.db")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    
    # CORS Origins
    _raw_cors = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    )
    CORS_ORIGINS: List[str] = [origin.strip() for origin in _raw_cors.split(",") if origin.strip()]
    
    # Operational Modes
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "False").lower() in ("true", "1", "yes")
    SIMULATED_FIREWALL: bool = os.getenv("SIMULATED_FIREWALL", "False").lower() in ("true", "1", "yes")
    FIREWALL_DRY_RUN: bool = os.getenv("FIREWALL_DRY_RUN", "True").lower() in ("true", "1", "yes")
    AUTO_BLOCK_ENABLED: bool = os.getenv("AUTO_BLOCK_ENABLED", "False").lower() in ("true", "1", "yes")
    AUTO_BLOCK_THRESHOLD: int = int(os.getenv("AUTO_BLOCK_THRESHOLD", "80"))
    FIREWALL_RULE_PREFIX: str = "PortSentinel_BLOCK_"
    PROTECTED_IPS: List[str] = ["127.0.0.1", "::1", "0.0.0.0", "localhost"]
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

settings = Settings()

