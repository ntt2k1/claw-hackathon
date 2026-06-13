import os
from dotenv import load_dotenv

load_dotenv()

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 7 days

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./sole.db")
SQLITE_PATH = os.getenv("SQLITE_PATH", "./sole.db")

AGENTBASE_MEMORY_ID = os.getenv("AGENTBASE_MEMORY_ID", "")
AGENTBASE_STRATEGY_ID = os.getenv("AGENTBASE_STRATEGY_ID", "")
