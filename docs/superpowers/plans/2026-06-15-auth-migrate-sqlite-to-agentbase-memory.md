# Auth: Migrate SQLite → AgentBase Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all SQLite auth operations with AgentBase Memory reads/writes so user accounts survive container restarts and redeploys.

**Architecture:** User records (email, password_hash, user_id) are stored in AgentBase Memory under a per-email namespace keyed by sha256(email). JWT is extended to carry email so `/me` never needs a DB lookup. The `has_vibe` flag is eliminated — live-checked from vibe profile existence. SQLite (`database.py`, `init_db`) is removed entirely.

**Tech Stack:** Python 3.12, FastAPI, `greennode_agentbase.memory.MemoryClient`, `python-jose`, `bcrypt`.

---

## Files

| Action | File |
|--------|------|
| Modify | `backend/memory/service.py` |
| Modify | `backend/auth/service.py` |
| Modify (rewrite) | `backend/auth/router.py` |
| Modify | `backend/recommendations/router.py` |
| Modify | `backend/main.py` |
| Delete | `backend/database.py` |

---

### Task 1: Add user auth functions to memory/service.py

**Files:**
- Modify: `backend/memory/service.py`

- [ ] **Step 1: Add `hashlib` import and `_user_auth_namespace` helper**

Open `backend/memory/service.py`. At the top, `import json` already exists. Add `import hashlib` on the line after it:

```python
import hashlib
```

Then, after the existing `_ratings_namespace` function at the bottom of the file, add:

```python
def _user_auth_namespace(email: str) -> str:
    email_hash = hashlib.sha256(email.lower().encode()).hexdigest()
    return f"/strategies/{AGENTBASE_STRATEGY_ID}/global/users/{email_hash}"
```

- [ ] **Step 2: Add `save_user_auth` and `get_user_by_email`**

Immediately after `_user_auth_namespace`, add:

```python
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
```

- [ ] **Step 3: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
python3 -m py_compile backend/memory/service.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/memory/service.py
git commit -m "feat: add save_user_auth and get_user_by_email to memory service"
```

---

### Task 2: Update auth/service.py — JWT encodes email

**Files:**
- Modify: `backend/auth/service.py`

- [ ] **Step 1: Update `create_jwt` to accept and encode email**

Open `backend/auth/service.py`. Find the current `create_jwt`:

```python
def create_jwt(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
```

Replace with:

```python
def create_jwt(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
```

- [ ] **Step 2: Update `decode_jwt` to return a dict**

Find the current `decode_jwt`:

```python
def decode_jwt(token: str) -> str:
    """Returns user_id from token or raises JWTError."""
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return payload["sub"]
```

Replace with:

```python
def decode_jwt(token: str) -> dict:
    """Returns full payload dict or raises JWTError."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
```

- [ ] **Step 3: Verify syntax**

```bash
python3 -m py_compile backend/auth/service.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/auth/service.py
git commit -m "feat: JWT encodes email, decode_jwt returns full payload dict"
```

---

### Task 3: Rewrite auth/router.py — replace SQLite with Memory

**Files:**
- Modify: `backend/auth/router.py`

- [ ] **Step 1: Replace the entire file content**

Overwrite `backend/auth/router.py` with:

```python
from fastapi import APIRouter, HTTPException, Depends, Header
from auth.schemas import RegisterRequest, LoginRequest, UserResponse
from auth.service import (
    hash_password, verify_password, create_jwt, decode_jwt, new_user_id, now_iso
)
from memory.service import save_user_auth, get_user_by_email, get_vibe_profile

router = APIRouter(prefix="/api/auth")

async def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_jwt(token)
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/register")
async def register(req: RegisterRequest):
    existing = await get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user_id = new_user_id()
    record = {
        "user_id": user_id,
        "email": req.email,
        "password_hash": hash_password(req.password),
        "created_at": now_iso(),
    }
    await save_user_auth(req.email, record)
    token = create_jwt(user_id, req.email)
    return {"token": token, "user": {"id": user_id, "email": req.email, "has_vibe": False}}

@router.post("/login")
async def login(req: LoginRequest):
    record = await get_user_by_email(req.email)
    if not record or not verify_password(req.password, record["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    has_vibe = await get_vibe_profile(record["user_id"]) is not None
    token = create_jwt(record["user_id"], req.email)
    return {
        "token": token,
        "user": {"id": record["user_id"], "email": req.email, "has_vibe": has_vibe},
    }

@router.get("/me", response_model=UserResponse)
async def me(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_jwt(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload["sub"]
    email = payload.get("email", "")
    has_vibe = await get_vibe_profile(user_id) is not None
    return UserResponse(id=user_id, email=email, has_vibe=has_vibe)
```

- [ ] **Step 2: Verify syntax**

```bash
python3 -m py_compile backend/auth/router.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/auth/router.py
git commit -m "feat: replace SQLite auth with AgentBase Memory in auth router"
```

---

### Task 4: Remove SQLite has_vibe update from recommendations/router.py

**Files:**
- Modify: `backend/recommendations/router.py`

- [ ] **Step 1: Remove the SQLite block from `quiz_complete`**

Open `backend/recommendations/router.py`. Find the `quiz_complete` endpoint body. It currently contains:

```python
    await save_vibe_profile(user_id, profile)
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("UPDATE users SET has_vibe = 1 WHERE id = ?", (user_id,))
        await db.commit()
    return {"status": "ok", "profile": profile}
```

Replace with:

```python
    await save_vibe_profile(user_id, profile)
    return {"status": "ok", "profile": profile}
```

- [ ] **Step 2: Remove unused imports**

At the top of `backend/recommendations/router.py`, remove these two lines:

```python
import aiosqlite
from config import SQLITE_PATH
```

(Check that no other code in the file uses `aiosqlite` or `SQLITE_PATH` before deleting.)

- [ ] **Step 3: Verify syntax**

```bash
python3 -m py_compile backend/recommendations/router.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/recommendations/router.py
git commit -m "feat: remove SQLite has_vibe update from quiz_complete"
```

---

### Task 5: Remove init_db from main.py and delete database.py

**Files:**
- Modify: `backend/main.py`
- Delete: `backend/database.py`

- [ ] **Step 1: Remove `init_db` import from main.py**

Open `backend/main.py`. Find and remove this line:

```python
from database import init_db
```

- [ ] **Step 2: Remove `init_db()` call from the lifespan/startup handler**

In `backend/main.py`, find and remove:

```python
    await init_db()
```

The surrounding lifespan/startup block stays — only this one call is removed.

- [ ] **Step 3: Delete database.py**

```bash
rm /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend/database.py
```

- [ ] **Step 4: Verify all backend files compile**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
python3 -m py_compile backend/memory/service.py backend/auth/service.py backend/auth/router.py backend/recommendations/router.py backend/main.py && echo "All OK"
```

Expected: `All OK`

- [ ] **Step 5: Commit**

```bash
git add backend/main.py
git rm backend/database.py
git commit -m "feat: remove SQLite init_db, delete database.py — auth fully on AgentBase Memory"
```
