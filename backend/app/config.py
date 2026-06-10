import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GEMINI_API_KEY: str = "your_gemini_api_key_here"
    VIRUSTOTAL_API_KEY: str = "your_virustotal_api_key_here"
    NVD_API_KEY: str = "your_nvd_api_key_here"
    CHROMA_DB_PATH: str = "./chromadb_data"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    AUTH_USERNAME: str = "security.analyst"
    AUTH_PASSWORD: str = "VigilanceAI#2026"
    AUTH_COMPANY_ID: str = "ACME-CORP"
    # Demo allowed credentials mapping for server-side auth
    ALLOWED_CREDENTIALS: dict = {
        "SOC-VPER28": "StringLA",
        "SOC-VPER27": "StringBA",
        "SOC": "Demo",
    }
    AUTH_TOKEN: str = "vigilance-session-token"
    # JWT settings
    JWT_SECRET: str = "replace-this-with-a-secure-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
