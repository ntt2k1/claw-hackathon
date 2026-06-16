# Share Itinerary — Design Spec

## Goal

User bấm "Chia sẻ" trên màn lịch trình → nhận link ngắn có thời hạn → bất kỳ ai có link có thể xem lịch trình đó mà không cần đăng nhập.

## Architecture

JWT share token: backend ký `{places, itinerary, location, trip_type}` thành JWT với expiry từ config. Link dạng `{origin}/share/{token}`. Frontend check pathname khi mount — nếu là `/share/...` thì fetch data và render read-only view mà không cần auth.

Không cần database mới, không cần storage. Dùng lại `JWT_SECRET` và `python-jose` đã có sẵn.

---

## Backend

### 1. `backend/config.py`

Thêm:
```python
SHARE_TTL_HOURS = int(os.getenv("SHARE_TTL_HOURS", "48"))
```

### 2. `backend/auth/service.py`

Thêm 2 functions dùng `JWT_SECRET` và `JWT_ALGORITHM` đã có:

```python
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS, SHARE_TTL_HOURS

def create_share_jwt(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=SHARE_TTL_HOURS)
    payload = {"share": data, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_share_jwt(token: str) -> dict:
    """Returns the share data dict, or raises JWTError if invalid/expired."""
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return payload["share"]
```

### 3. `backend/recommendations/router.py`

Thêm 2 endpoints (không cần auth guard trên GET):

**POST /api/share** — auth required, tạo share token:
```python
class ShareRequest(BaseModel):
    places: list
    itinerary: list
    location: str
    trip_type: str

@router.post("/share")
async def create_share(
    req: ShareRequest,
    user_id: str = Depends(get_current_user_id),
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

**GET /api/share/{token}** — public, trả data hoặc 410:
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

---

## Frontend

### 4. `frontend/src/api.js`

Thêm 2 methods:

```js
async createShare({ places, itinerary, location, trip_type }) {
  return request('POST', '/share', { places, itinerary, location, trip_type })
},
async getShare(token) {
  // Public — no auth header needed
  const res = await fetch(`/api/share/${token}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Link hết hạn')
  return data
},
```

### 5. `frontend/src/App.jsx`

Check `window.location.pathname` trước khi render auth flow. Thêm vào trước return:

```js
const shareToken = window.location.pathname.startsWith('/share/')
  ? window.location.pathname.split('/share/')[1]
  : null

if (shareToken) {
  return <SharedItinerary token={shareToken} />
}
```

Thêm `SharedItinerary` vào imports.

### 6. `frontend/src/components/Itinerary.jsx`

Thêm nút "Chia sẻ" trong header hoặc footer của màn Itinerary (cạnh nút "Lên kế hoạch lại"). Khi bấm:

1. Gọi `api.createShare({ places, itinerary, location, trip_type })`
2. Build URL: `${window.location.origin}/share/${token}`
3. Copy vào clipboard: `navigator.clipboard.writeText(url)`
4. Hiện toast text ngắn: "Đã copy link chia sẻ!" trong 2 giây

Nút nhận `recommendations`, `location`, `tripType` qua props (đã có sẵn).

### 7. `frontend/src/components/SharedItinerary.jsx` (file mới)

Component nhận prop `token`, tự fetch data khi mount:

```jsx
export default function SharedItinerary({ token }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getShare(token)
      .then(setData)
      .catch(() => setError('Link đã hết hạn hoặc không hợp lệ'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <LoadingState />
  if (error) return <ExpiredState message={error} />
  return <ReadOnlyItinerary data={data} />
}
```

**UI `ReadOnlyItinerary`:**
- Header: "SOLE" logo + "Lịch trình được chia sẻ"
- Location badge: `📍 {data.location}`
- Danh sách itinerary card — giống Itinerary hiện tại nhưng:
  - Không có rating buttons (👍👎)
  - Vẫn có 📍 Google Maps và 🔗 Source links
- Không có BottomNav, không có "Lên kế hoạch lại"
- CTA cuối: "Tạo lịch trình của riêng bạn →" → link đến `{origin}/` (trang chính)

**UI `ExpiredState`:**
- Icon ⏰, text "Link đã hết hạn", CTA "Tạo lịch trình mới →"

---

## Edge Cases

- Token hết hạn → backend trả 410 → frontend hiện ExpiredState
- Token bị tamper → `JWTError` → 410
- `navigator.clipboard` không available (HTTP, older browser) → fallback: `window.prompt('Copy link:', url)`
- Itinerary rất lớn → JWT payload lớn nhưng vẫn trong giới hạn URL/header của browser (vài KB, ok)

## Scope

| File | Thay đổi |
|------|----------|
| `backend/config.py` | Thêm `SHARE_TTL_HOURS` |
| `backend/auth/service.py` | Thêm `create_share_jwt` + `decode_share_jwt` |
| `backend/recommendations/router.py` | Thêm `POST /api/share` + `GET /api/share/{token}` |
| `frontend/src/api.js` | Thêm `createShare()` + `getShare()` |
| `frontend/src/App.jsx` | Check `/share/` pathname, render SharedItinerary |
| `frontend/src/components/Itinerary.jsx` | Thêm nút Chia sẻ + toast |
| `frontend/src/components/SharedItinerary.jsx` | Component mới — read-only view |
