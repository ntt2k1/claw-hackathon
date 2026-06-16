# Short ID Share Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay JWT-in-URL bằng 8-char short ID lưu server-side trong SQLite, biến URL share từ ~500 ký tự thành `/share/k7mPq2xN`.

**Architecture:** Tạo `backend/database.py` với `init_db()` (tạo bảng `shared_itineraries`), `save_share()`, `get_share()`. Gọi `init_db()` trong `main.py` lifespan. Thay 2 endpoints share trong `router.py` để dùng DB thay vì JWT. Xoá `create_share_jwt`/`decode_share_jwt` khỏi `auth/service.py`.

**Tech Stack:** Python/aiosqlite, FastAPI, `secrets.token_urlsafe(6)` (8-char ID).

---

## Files

| File | Action |
|------|--------|
| `backend/database.py` | Tạo mới — `init_db`, `save_share`, `get_share`, `SQLITE_PATH` |
| `backend/main.py` | Gọi `init_db()` trong lifespan |
| `backend/recommendations/router.py` | Thay JWT calls bằng DB calls trong 2 share endpoints |
| `backend/auth/service.py` | Xoá `create_share_jwt`, `decode_share_jwt`, bỏ `SHARE_TTL_HOURS` khỏi import |
| `backend/tests/test_database.py` | Thêm tests cho `shared_itineraries` table, `save_share`, `get_share` |

---

## Task 1: Tạo `backend/database.py`

**Files:**
- Create: `backend/database.py`
- Modify: `backend/tests/test_database.py`

### Context

Hiện tại `backend/tests/test_database.py` đã có test cho `init_db` và `users` table, patch `database.SQLITE_PATH`. File `backend/database.py` chưa tồn tại — cần tạo.

Config hiện có: `SQLITE_PATH = os.getenv("SQLITE_PATH", "./data/sole.db")` trong `backend/config.py`.

- [ ] **Step 1: Thêm tests cho `shared_itineraries` vào `backend/tests/test_database.py`**

Thêm vào cuối file `backend/tests/test_database.py`:

```python
@pytest.mark.asyncio
async def test_init_db_creates_shared_itineraries_table():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch("database.SQLITE_PATH", TEST_DB):
        from importlib import reload
        import database
        reload(database)
        await database.init_db()
    async with aiosqlite.connect(TEST_DB) as db:
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='shared_itineraries'"
        )
        row = await cursor.fetchone()
    assert row is not None
    assert row[0] == "shared_itineraries"
    os.remove(TEST_DB)


@pytest.mark.asyncio
async def test_save_and_get_share():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch("database.SQLITE_PATH", TEST_DB):
        from importlib import reload
        import database
        reload(database)
        await database.init_db()
        data = {"places": [{"name": "Test Place"}], "itinerary": [], "location": "Hanoi", "trip_type": "inday"}
        share_id = await database.save_share(data)
        result = await database.get_share(share_id)
    assert result is not None
    assert result["location"] == "Hanoi"
    assert result["places"][0]["name"] == "Test Place"
    os.remove(TEST_DB)


@pytest.mark.asyncio
async def test_get_share_returns_none_for_expired():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch("database.SQLITE_PATH", TEST_DB):
        from importlib import reload
        import database
        reload(database)
        await database.init_db()
        # Insert a row with past expiry directly
        import aiosqlite, json
        expired_at = "2000-01-01T00:00:00+00:00"
        async with aiosqlite.connect(TEST_DB) as db:
            await db.execute(
                "INSERT INTO shared_itineraries (id, data, expires_at) VALUES (?, ?, ?)",
                ("expired1", json.dumps({"test": True}), expired_at)
            )
            await db.commit()
        result = await database.get_share("expired1")
    assert result is None
    os.remove(TEST_DB)


@pytest.mark.asyncio
async def test_get_share_returns_none_for_unknown_id():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with patch("database.SQLITE_PATH", TEST_DB):
        from importlib import reload
        import database
        reload(database)
        await database.init_db()
        result = await database.get_share("doesnotexist")
    assert result is None
    os.remove(TEST_DB)
```

- [ ] **Step 2: Chạy tests để verify chúng fail**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python -m pytest tests/test_database.py -v 2>&1 | tail -20
```

Expected: FAIL với "ModuleNotFoundError: No module named 'database'" hoặc ImportError.

- [ ] **Step 3: Tạo `backend/database.py`**

Tạo file `backend/database.py`:

```python
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
```

- [ ] **Step 4: Chạy tests để verify chúng pass**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python -m pytest tests/test_database.py -v 2>&1 | tail -20
```

Expected: tất cả tests PASS (5 tests: 1 existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add backend/database.py backend/tests/test_database.py
git commit -m "feat: add database.py with shared_itineraries table and save/get_share functions"
```

---

## Task 2: Gọi `init_db()` trong `main.py` lifespan

**Files:**
- Modify: `backend/main.py`

### Context

`backend/main.py` hiện có `lifespan` context manager với body rỗng (`yield` thôi). Cần gọi `init_db()` ở đây để bảng được tạo khi app khởi động.

- [ ] **Step 1: Thêm `init_db()` call vào lifespan trong `backend/main.py`**

Thay thế:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
```

Bằng:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    from database import init_db
    await init_db()
    yield
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python3 -m py_compile main.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/main.py
git commit -m "feat: call init_db() on app startup to ensure tables exist"
```

---

## Task 3: Thay JWT share bằng DB share trong router

**Files:**
- Modify: `backend/recommendations/router.py`

### Context

Hiện tại `POST /api/share` gọi `create_share_jwt(...)` và `GET /api/share/{token}` gọi `decode_share_jwt(...)`. Cần thay cả hai bằng `save_share()` và `get_share()` từ `database.py`.

Không thay đổi gì khác (model `ShareRequest` giữ nguyên, response `{"token": share_id}` giữ nguyên).

- [ ] **Step 1: Thay 2 share endpoints trong `backend/recommendations/router.py`**

Tìm và thay thế endpoint `POST /api/share` (lines ~124-136):

**Cũ:**
```python
@router.post("/share")
async def create_share(
    req: ShareRequest,
    _user_id: str = Depends(get_current_user_id),
):
    from auth.service import create_share_jwt
    token = create_share_jwt({
        "places": req.places,
        "itinerary": req.itinerary,
        "location": req.location,
        "trip_type": req.trip_type,
    })
    return {"token": token}
```

**Mới:**
```python
@router.post("/share")
async def create_share(
    req: ShareRequest,
    _user_id: str = Depends(get_current_user_id),
):
    from database import save_share
    share_id = await save_share({
        "places": req.places,
        "itinerary": req.itinerary,
        "location": req.location,
        "trip_type": req.trip_type,
    })
    return {"token": share_id}
```

Tìm và thay thế endpoint `GET /api/share/{token}` (lines ~138-146):

**Cũ:**
```python
@router.get("/share/{token}")
async def get_share(token: str):
    from auth.service import decode_share_jwt
    from jose import JWTError
    try:
        data = decode_share_jwt(token)
        return data
    except JWTError:
        raise HTTPException(status_code=410, detail="Link đã hết hạn hoặc không hợp lệ")
```

**Mới:**
```python
@router.get("/share/{token}")
async def get_share_endpoint(token: str):
    from database import get_share
    data = await get_share(token)
    if data is None:
        raise HTTPException(status_code=410, detail="Link đã hết hạn hoặc không hợp lệ")
    return data
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python3 -m py_compile recommendations/router.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/recommendations/router.py
git commit -m "feat: replace JWT share with short ID DB-backed share endpoints"
```

---

## Task 4: Cleanup — xoá JWT share functions khỏi `auth/service.py`

**Files:**
- Modify: `backend/auth/service.py`

### Context

`backend/auth/service.py` hiện có `create_share_jwt`, `decode_share_jwt` và import `SHARE_TTL_HOURS`. Sau khi Task 3 xong, các hàm này không còn được dùng ở đâu nữa. Xoá để tránh dead code.

Hiện tại dòng import là:
```python
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS, SHARE_TTL_HOURS
```

Sau khi xoá hai functions, `SHARE_TTL_HOURS` không cần import nữa (nó được dùng trong `database.py` thay vào đó).

- [ ] **Step 1: Xoá import `SHARE_TTL_HOURS` và 2 functions khỏi `backend/auth/service.py`**

Thay dòng import:

**Cũ:**
```python
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS, SHARE_TTL_HOURS
```

**Mới:**
```python
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS
```

Xoá toàn bộ 2 functions ở cuối file:

```python
def create_share_jwt(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=SHARE_TTL_HOURS)
    payload = {"share": data, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_share_jwt(token: str) -> dict:
    """Returns the share data dict, or raises JWTError if invalid/expired."""
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return payload["share"]
```

File sau khi xoá sẽ kết thúc ở:

```python
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
```

- [ ] **Step 2: Verify syntax và không còn reference nào tới các hàm đã xoá**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python3 -m py_compile auth/service.py && echo "OK"
grep -r "create_share_jwt\|decode_share_jwt" . --include="*.py" && echo "FOUND_REFS" || echo "CLEAN"
```

Expected: `OK` rồi `CLEAN` (không có reference nào còn lại).

- [ ] **Step 3: Chạy tất cả tests để đảm bảo không break gì**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python -m pytest tests/ -v 2>&1 | tail -20
```

Expected: tất cả tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/auth/service.py
git commit -m "refactor: remove unused JWT share functions from auth/service.py"
```
