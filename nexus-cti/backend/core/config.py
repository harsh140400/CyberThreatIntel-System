"""Application configuration — reads from .env"""
import secrets
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "NEXUS CTI Platform"
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480          # 8 hours

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexus_cti.db"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # AI / Anthropic
    ANTHROPIC_API_KEY: str = ""

    # Feeds
    FEED_REFRESH_INTERVAL_SECONDS: int = 60
    MAX_FEED_ITEMS: int = 500

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 200
    RATE_LIMIT_WINDOW: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
