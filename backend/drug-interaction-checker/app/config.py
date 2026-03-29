"""Application configuration loaded from environment variables via pydantic-settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object. Values are read from the .env file at startup."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Gemini
    GEMINI_API_KEY: str

    # Auth
    JWT_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./drug_checker.db"

    # App metadata
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"


settings = Settings()  # type: ignore[call-arg]
