import pytest
import os
import sys
import aiosqlite
from unittest.mock import patch

TEST_DB = "/tmp/test_sole.db"

@pytest.mark.asyncio
async def test_init_db_creates_users_table():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch.dict(os.environ, {"SQLITE_PATH": TEST_DB}):
        # Remove cached modules to force reimport with new env var
        mods_to_remove = [m for m in sys.modules if 'database' in m or 'config' in m]
        for m in mods_to_remove:
            del sys.modules[m]
        from database import init_db
        await init_db()
    async with aiosqlite.connect(TEST_DB) as db:
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        row = await cursor.fetchone()
    assert row is not None
    assert row[0] == "users"
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)


@pytest.mark.asyncio
async def test_init_db_creates_shared_itineraries_table():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch.dict(os.environ, {"SQLITE_PATH": TEST_DB}):
        mods_to_remove = [m for m in sys.modules if 'database' in m or 'config' in m]
        for m in mods_to_remove:
            del sys.modules[m]
        import database
        await database.init_db()
        async with aiosqlite.connect(TEST_DB) as db:
            cursor = await db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='shared_itineraries'"
            )
            row = await cursor.fetchone()
        assert row is not None
        assert row[0] == "shared_itineraries"
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)


@pytest.mark.asyncio
async def test_save_and_get_share():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch.dict(os.environ, {"SQLITE_PATH": TEST_DB}):
        mods_to_remove = [m for m in sys.modules if 'database' in m or 'config' in m]
        for m in mods_to_remove:
            del sys.modules[m]
        import database
        await database.init_db()
        data = {"places": [{"name": "Test Place"}], "itinerary": [], "location": "Hanoi", "trip_type": "inday"}
        share_id = await database.save_share(data)
        result = await database.get_share(share_id)
        assert result is not None
        assert result["location"] == "Hanoi"
        assert result["places"][0]["name"] == "Test Place"
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)


@pytest.mark.asyncio
async def test_get_share_returns_none_for_expired():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch.dict(os.environ, {"SQLITE_PATH": TEST_DB}):
        mods_to_remove = [m for m in sys.modules if 'database' in m or 'config' in m]
        for m in mods_to_remove:
            del sys.modules[m]
        import database
        import json
        await database.init_db()
        expired_at = "2000-01-01T00:00:00+00:00"
        async with aiosqlite.connect(TEST_DB) as db:
            await db.execute(
                "INSERT INTO shared_itineraries (id, data, expires_at) VALUES (?, ?, ?)",
                ("expired1", json.dumps({"test": True}), expired_at)
            )
            await db.commit()
        result = await database.get_share("expired1")
        assert result is None
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)


@pytest.mark.asyncio
async def test_get_share_returns_none_for_unknown_id():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch.dict(os.environ, {"SQLITE_PATH": TEST_DB}):
        mods_to_remove = [m for m in sys.modules if 'database' in m or 'config' in m]
        for m in mods_to_remove:
            del sys.modules[m]
        import database
        await database.init_db()
        result = await database.get_share("doesnotexist")
        assert result is None
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
