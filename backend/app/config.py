from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SECRET_KEY: str
    CLERK_ISSUER: str
    CLERK_AUTHORIZED_PARTIES: str
    STORAGE_BUCKET: str = "brand-assets"
    ADMIN_EMAILS: str = ""
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3001,http://127.0.0.1:3001,http://localhost,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
