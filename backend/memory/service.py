import json
import hashlib
from greennode_agentbase.memory import MemoryClient
from config import AGENTBASE_MEMORY_ID, AGENTBASE_STRATEGY_ID

_client = MemoryClient()

def _namespace(user_id: str) -> str:
    return f"/strategies/{AGENTBASE_STRATEGY_ID}/actors/{user_id}"

async def save_vibe_profile(user_id: str, profile: dict) -> None:
    """Store vibe profile as a memory record. Overwrites any existing record."""
    record_str = json.dumps(profile, ensure_ascii=False)
    await _client.insert_memory_records_directly_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_namespace(user_id),
        request={"memoryRecords": [record_str]},
    )

async def get_vibe_profile(user_id: str) -> dict | None:
    """Retrieve the most recent vibe profile record for a user, or None if not found."""
    records = await _client.list_memory_records_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_namespace(user_id),
    )
    if not records:
        return None
    latest = records[-1]
    if isinstance(latest, dict):
        raw = latest.get("memory", "")
    else:
        raw = getattr(latest, "memory", str(latest))
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None

def _ratings_namespace(user_id: str) -> str:
    return f"/strategies/{AGENTBASE_STRATEGY_ID}/actors/{user_id}/ratings"

async def save_place_rating(user_id: str, rating: dict) -> None:
    record_str = json.dumps(rating, ensure_ascii=False)
    await _client.insert_memory_records_directly_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_ratings_namespace(user_id),
        request={"memoryRecords": [record_str]},
    )

async def get_place_ratings(user_id: str) -> list[dict]:
    records = await _client.list_memory_records_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_ratings_namespace(user_id),
    )
    if not records:
        return []
    result = []
    for rec in records:
        raw = rec.get("memory", "") if isinstance(rec, dict) else getattr(rec, "memory", "")
        try:
            result.append(json.loads(raw))
        except (json.JSONDecodeError, TypeError):
            pass
    return result

def _user_auth_namespace(email: str) -> str:
    email_hash = hashlib.sha256(email.lower().encode()).hexdigest()
    return f"/strategies/{AGENTBASE_STRATEGY_ID}/global/users/{email_hash}"

async def save_user_auth(email: str, record: dict) -> None:
    record_str = json.dumps(record, ensure_ascii=False)
    await _client.insert_memory_records_directly_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_user_auth_namespace(email),
        request={"memoryRecords": [record_str]},
    )

async def get_user_by_email(email: str) -> dict | None:
    records = await _client.list_memory_records_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_user_auth_namespace(email),
    )
    if not records:
        return None
    latest = records[-1]
    raw = latest.get("memory", "") if isinstance(latest, dict) else getattr(latest, "memory", str(latest))
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None
