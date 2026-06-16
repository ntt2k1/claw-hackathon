# Short ID Share Links — Design Spec

## Goal

Thay JWT-in-URL (URL dài ~500+ ký tự) bằng short ID lưu server-side. URL share thành `/share/k7mPq2xN` — 8 ký tự, ngắn gọn, dễ copy và share.

## Architecture

Khi user bấm "Chia sẻ", backend INSERT data vào bảng SQLite `shared_itineraries` với 8-char random ID và `expires_at`. URL thành `{origin}/share/{id}`. Khi ai đó mở link, backend tra ID, kiểm tra TTL, trả data hoặc 410.

Không cần cleanup job — query tự lọc `expires_at > now()`, rows cũ tự trở thành invisible.

Frontend không thay đổi gì — response shape `{"token": "..."}` giữ nguyên.

---

## Backend

### Database — bảng mới `shared_itineraries`

Trong `backend/data/database.py`, thêm:

1. **Table creation** (chạy cùng với `CREATE TABLE IF NOT EXISTS users`):

```sql
CREATE TABLE IF NOT EXISTS shared_itineraries (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    expires_at TEXT NOT NULL
)
```

2. **`save_share(data: dict) -> str`** — tạo ID, INSERT, trả ID:

```python
import secrets, json
from datetime import datetime, timezone, timedelta
from config import SHARE_TTL_HOURS

async def save_share(data: dict) -> str:
    share_id = secrets.token_urlsafe(6)  # 8 ký tự URL-safe
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=SHARE_TTL_HOURS)).isoformat()
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute(
            "INSERT INTO shared_itineraries (id, data, expires_at) VALUES (?, ?, ?)",
            (share_id, json.dumps(data), expires_at)
        )
        await db.commit()
    return share_id
```

3. **`get_share(share_id: str) -> dict | None`** — SELECT + kiểm tra TTL:

```python
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

### Endpoint changes — `backend/recommendations/router.py`

Thay `create_share_jwt` / `decode_share_jwt` bằng DB calls:

**POST /api/share** (thay create_share_jwt):
```python
@router.post("/share")
async def create_share(req: ShareRequest, _user_id: str = Depends(get_current_user_id)):
    from data.database import save_share
    share_id = await save_share({
        "places": req.places,
        "itinerary": req.itinerary,
        "location": req.location,
        "trip_type": req.trip_type,
    })
    return {"token": share_id}
```

**GET /api/share/{token}** (thay decode_share_jwt):
```python
@router.get("/share/{token}")
async def get_share_endpoint(token: str):
    from data.database import get_share
    data = await get_share(token)
    if data is None:
        raise HTTPException(status_code=410, detail="Link đã hết hạn hoặc không hợp lệ")
    return data
```

### Cleanup — `backend/auth/service.py`

Xoá `create_share_jwt` và `decode_share_jwt` (không còn dùng).

Xoá `SHARE_TTL_HOURS` khỏi import trong `auth/service.py` (vẫn giữ trong `config.py`).

---

## Frontend

**Không thay đổi gì.** Response key vẫn là `{"token": "..."}`, frontend nhận và build URL `/share/{token}` như cũ.

---

## Scope

| File | Thay đổi |
|------|----------|
| `backend/data/database.py` | Thêm bảng `shared_itineraries` + `save_share()` + `get_share()` |
| `backend/recommendations/router.py` | Thay JWT calls bằng DB calls trong 2 endpoints |
| `backend/auth/service.py` | Xoá `create_share_jwt` + `decode_share_jwt` + import `SHARE_TTL_HOURS` |

**Không thay đổi:** `backend/config.py`, `frontend/` (tất cả).

## Edge Cases

- ID collision: `secrets.token_urlsafe(6)` tạo 8 ký tự từ 64-char alphabet → 64^8 ≈ 281 trillion khả năng. Collision thực tế không xảy ra ở scale hackathon. Nếu collision xảy ra (INSERT fail), đơn giản retry với ID mới.
- Link hết hạn → `get_share` trả `None` → 410. Rows cũ vẫn tồn tại trong DB nhưng invisible với query, không cần cleanup.
- Data lớn: JSON của itinerary ~5-10KB, SQLite TEXT không có giới hạn thực tế ở kích thước này.
