import aiosqlite
from config import SQLITE_PATH

async def get_db():
    async with aiosqlite.connect(SQLITE_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db

async def init_db():
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                has_vibe INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        await db.commit()
