from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    alpaca_api_key: str = ""
    alpaca_secret_key: str = ""
    alpaca_paper: bool = True

    fastapi_host: str = "0.0.0.0"
    fastapi_port: int = 8000
    cors_origins: List[str] = ["http://localhost:3000", "http://frontend:3000"]

    price_data_cache_ttl: int = 3600  # seconds


settings = Settings()
