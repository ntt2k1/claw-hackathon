import json
import secrets
import aiosqlite
from datetime import datetime, timezone, timedelta
from config import SQLITE_PATH, SHARE_TTL_HOURS


async def init_db():
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                data  TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS shared_itineraries (
                id         TEXT PRIMARY KEY,
                data       TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
        """)
        await db.commit()


async def save_share(data: dict) -> str:
    share_id = secrets.token_urlsafe(6)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=SHARE_TTL_HOURS)).isoformat()
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute(
            "INSERT INTO shared_itineraries (id, data, expires_at) VALUES (?, ?, ?)",
            (share_id, json.dumps(data), expires_at)
        )
        await db.commit()
    return share_id


async def get_share(share_id: str) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(SQLITE_PATH) as db:
        async with db.execute(
            "SELECT data FROM shared_itineraries WHERE id = ? AND expires_at > ?",
            (share_id, now)
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        return None
    return json.loads(row[0])
