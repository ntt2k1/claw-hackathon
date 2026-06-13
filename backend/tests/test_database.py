import pytest
import os
import aiosqlite
from unittest.mock import patch

TEST_DB = "/tmp/test_sole.db"

@pytest.mark.asyncio
async def test_init_db_creates_users_table():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch("database.SQLITE_PATH", TEST_DB):
        from database import init_db
        await init_db()
    async with aiosqlite.connect(TEST_DB) as db:
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        row = await cursor.fetchone()
    assert row is not None
    assert row[0] == "users"
    os.remove(TEST_DB)
