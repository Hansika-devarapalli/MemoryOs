from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_llm_model: str = "gemma3:4b"
    ollama_embed_model: str = "nomic-embed-text"
    chroma_path: str = "./.chroma"
    chroma_collection: str = "memoryos"
    database_url: str = "sqlite:///./memoryos.db"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
