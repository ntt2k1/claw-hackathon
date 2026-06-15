# Vibe SQLite Persistence — Design Spec

## Problem

After logout/login, the user's vibe profile (quiz results) disappears. Root cause: vibe is saved to AgentBase Memory only, but `get_vibe_profile` (AgentBase Memory read) silently fails when not accessible locally. The `vibe_json TEXT` column already exists in the `users` SQLite table but is never written or read.

## Solution

Use SQLite as primary storage for vibe profiles. AgentBase Memory remains as a secondary write (unchanged). No frontend changes. No schema changes (column already exists).

## Changes — `backend/recommendations/router.py`

### POST /api/quiz/complete

Add `vibe_json` to the existing SQLite UPDATE (same transaction, one line change):

```python
await db.execute(
    "UPDATE users SET has_vibe = 1, vibe_json = ? WHERE id = ?",
    (json.dumps(profile), user_id)
)
```

### GET /api/vibe

Read from SQLite first. If `vibe_json` is populated, return it immediately. Fall back to AgentBase Memory only if null.

```python
import json

async with aiosqlite.connect(SQLITE_PATH) as db:
    db.row_factory = aiosqlite.Row
    cursor = await db.execute("SELECT vibe_json FROM users WHERE id = ?", (user_id,))
    row = await cursor.fetchone()
    if row and row["vibe_json"]:
        return json.loads(row["vibe_json"])

profile = await get_vibe_profile(user_id)
if not profile:
    raise HTTPException(status_code=404, detail="No vibe profile found")
return profile
```

## No changes to

- `frontend/` — existing load flow is correct, just needs backend to reliably return data
- `backend/database.py` — `vibe_json TEXT` column already exists and is migrated
- `backend/memory/service.py` — AgentBase Memory save stays as-is
