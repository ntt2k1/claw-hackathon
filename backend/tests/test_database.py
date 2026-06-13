import pytest
import os
import aiosqlite

os.environ["SQLITE_PATH"] = "/tmp/test_sole.db"

from database import init_db
from config import SQLITE_PATH

@pytest.mark.asyncio
async def test_init_db_creates_users_table():
    if os.path.exists(SQLITE_PATH):
        os.remove(SQLITE_PATH)
    await init_db()
    async with aiosqlite.connect(SQLITE_PATH) as db:
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        row = await cursor.fetchone()
    assert row is not None
    assert row[0] == "users"
    os.remove(SQLITE_PATH)
