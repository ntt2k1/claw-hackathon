import json
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
        memoryRecords=[record_str],
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
    raw = latest.memory if hasattr(latest, "memory") else str(latest)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
