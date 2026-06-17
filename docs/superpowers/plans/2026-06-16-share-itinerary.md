# Share Itinerary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** User bấm "Chia sẻ" trên màn lịch trình → nhận link có thời hạn → bất kỳ ai có link xem được lịch trình read-only mà không cần đăng nhập.

**Architecture:** Backend ký itinerary data thành JWT (dùng lại `JWT_SECRET` đã có) với TTL từ env var `SHARE_TTL_HOURS`. Frontend check `window.location.pathname` khi mount — nếu `/share/{token}` thì fetch và render read-only `SharedItinerary` component, bỏ qua toàn bộ auth flow.

**Tech Stack:** Python/FastAPI + python-jose (đã có), React 18 + TailwindCSS v3, `navigator.clipboard` API.

---

## Files

| File | Action |
|------|--------|
| `backend/config.py` | Thêm `SHARE_TTL_HOURS` |
| `backend/auth/service.py` | Thêm `create_share_jwt` + `decode_share_jwt` |
| `backend/recommendations/router.py` | Thêm `POST /api/share` + `GET /api/share/{token}` + `ShareRequest` model |
| `frontend/src/api.js` | Thêm `createShare()` + `getShare()` |
| `frontend/src/App.jsx` | Check `/share/` pathname trước auth flow |
| `frontend/src/components/Itinerary.jsx` | Thêm nút Chia sẻ + toast |
| `frontend/src/components/SharedItinerary.jsx` | Tạo mới — read-only itinerary view |

---

## Task 1: Config + JWT share functions (backend)

**Files:**
- Modify: `backend/config.py`
- Modify: `backend/auth/service.py`

### Context

`backend/config.py` hiện có `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_HOURS`. Cần thêm `SHARE_TTL_HOURS`.

`backend/auth/service.py` hiện import từ config và dùng `python-jose`. Cần thêm 2 functions mới dùng cùng secret nhưng payload khác (key `"share"` thay vì `"sub"`).

- [ ] **Step 1: Thêm `SHARE_TTL_HOURS` vào config**

Trong `backend/config.py`, thêm dòng sau `JWT_EXPIRE_HOURS`:

```python
SHARE_TTL_HOURS = int(os.getenv("SHARE_TTL_HOURS", "48"))
```

- [ ] **Step 2: Thêm share JWT functions vào auth/service.py**

Trong `backend/auth/service.py`, thêm `SHARE_TTL_HOURS` vào import từ config:

```python
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS, SHARE_TTL_HOURS
```

Sau đó thêm 2 functions ở cuối file:

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

- [ ] **Step 3: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
python3 -m py_compile backend/config.py backend/auth/service.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/config.py backend/auth/service.py
git commit -m "feat: add SHARE_TTL_HOURS config and share JWT functions"
```

---

## Task 2: Share API endpoints (backend)

**Files:**
- Modify: `backend/recommendations/router.py`

### Context

`backend/recommendations/router.py` đã có pattern endpoint với `Depends(get_current_user_id)` cho auth và `HTTPException` cho errors. Cần thêm `ShareRequest` Pydantic model và 2 endpoints.

Hiện tại file import: `from fastapi import APIRouter, Depends, HTTPException`, `from auth.router import get_current_user_id`.

- [ ] **Step 1: Thêm `ShareRequest` model và 2 endpoints**

Trong `backend/recommendations/router.py`, thêm `ShareRequest` model sau các model hiện có (sau `PlaceRatingRequest`):

```python
class ShareRequest(BaseModel):
    places: list
    itinerary: list
    location: str
    trip_type: str
```

Thêm 2 endpoints sau endpoint `list_ratings`:

```python
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

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
python3 -m py_compile backend/recommendations/router.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/recommendations/router.py
git commit -m "feat: add POST /api/share and GET /api/share/{token} endpoints"
```

---

## Task 3: Frontend API methods

**Files:**
- Modify: `frontend/src/api.js`

### Context

`frontend/src/api.js` export một object `api` với các methods dùng `request(method, path, body)` helper cho authenticated calls. `getShare` cần bypass auth vì là public endpoint — dùng `fetch` trực tiếp thay vì `request`.

Hiện tại cuối file có dạng:
```js
export const api = {
  hasToken() { ... },
  ...
  ratePlace(data) { return request('POST', '/vibe/rate', data) },
  getVibeRatings() { return request('GET', '/vibe/ratings') },
}
```

- [ ] **Step 1: Thêm `createShare` và `getShare` vào api object**

Trong `frontend/src/api.js`, thêm 2 methods vào cuối object `api` (trước dấu `}`):

```js
  createShare({ places, itinerary, location, trip_type }) {
    return request('POST', '/share', { places, itinerary, location, trip_type })
  },
  async getShare(token) {
    const res = await fetch(`/api/share/${token}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Link hết hạn')
    return data
  },
```

- [ ] **Step 2: Verify bằng cách build frontend**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
npm --prefix frontend run build 2>&1 | tail -5
```

Expected: build thành công, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api.js
git commit -m "feat: add createShare and getShare API methods"
```

---

## Task 4: SharedItinerary component (frontend)

**Files:**
- Create: `frontend/src/components/SharedItinerary.jsx`

### Context

Component này là entry point khi user mở link chia sẻ. Nó tự fetch data từ `GET /api/share/{token}`, không cần login. Render itinerary cards giống `Itinerary.jsx` nhưng không có rating buttons, không có BottomNav.

Data shape từ backend: `{ places: [...], itinerary: [...], location: string, trip_type: string }`.

`placeByName` lookup và `buildMapsUrl` cần được copy từ `Itinerary.jsx` vì component này độc lập.

- [ ] **Step 1: Tạo `SharedItinerary.jsx`**

Tạo file `frontend/src/components/SharedItinerary.jsx` với nội dung:

```jsx
import { useState, useEffect, useMemo } from 'react'
import { api } from '../api.js'

function buildMapsUrl(item, place) {
  const q = [item.name, item.address || place?.address, place?.district]
    .filter(Boolean)
    .join(' ')
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`
}

function ExpiredState() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
      <span className="text-5xl">⏰</span>
      <h2 className="font-display text-headline-lg-mobile text-on-surface">Link đã hết hạn</h2>
      <p className="font-body text-body-md text-on-surface-variant">Link chia sẻ này không còn hiệu lực.</p>
      <a
        href="/"
        className="neon-gradient text-on-primary font-label text-label-md uppercase tracking-widest px-8 py-4 rounded-full shadow-neon-green"
      >
        Tạo lịch trình của riêng bạn →
      </a>
    </div>
  )
}

function ReadOnlyItinerary({ data }) {
  const placeByName = useMemo(
    () => Object.fromEntries((data.places || []).map(p => [p.name, p])),
    [data]
  )

  return (
    <div className="min-h-screen bg-background pb-16 relative overflow-hidden">
      <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant flex justify-center items-center h-16">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <main className="pt-6 pb-12 px-4">
        <div className="mb-6">
          <span className="font-label text-label-md text-primary uppercase tracking-widest bg-primary/10 px-4 py-1 rounded-full inline-block mb-3">
            Lịch trình được chia sẻ
          </span>
          <h2 className="font-display text-headline-lg-mobile text-on-surface leading-tight">
            {data.trip_type === 'inday' ? 'Lịch trình trong ngày' : 'Lịch trình chuyến xa'}
          </h2>
          {data.location && (
            <p className="font-label text-label-md text-on-surface-variant mt-1">
              📍 {data.location}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {data.itinerary?.map((item, i) => {
            const place = placeByName[item.name]
            const sourceUrl = place?.source_url
            return (
              <div
                key={i}
                className="animate-slide-in flex gap-4 items-start"
                style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-4 h-4 bg-primary rounded-full mt-1 shadow-neon-green" />
                  {i < data.itinerary.length - 1 && (
                    <div className="w-0.5 flex-1 bg-primary/20 mt-1" style={{ minHeight: '2rem' }} />
                  )}
                </div>

                <div className="bg-surface border border-outline-variant rounded-xl flex-1 p-4 mb-2">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-display text-headline-md text-on-surface leading-tight">
                      {item.time && <span className="text-primary font-bold mr-2">{item.time}</span>}
                      {item.name}
                    </p>
                  </div>
                  {item.description && (
                    <p className="font-body text-body-md text-on-surface-variant mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-3 flex-wrap mb-3">
                    {item.duration_note && (
                      <span className="font-label text-caption bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                        ⏱ {item.duration_note}
                      </span>
                    )}
                    {item.distance_from_prev && (
                      <span className="font-label text-caption bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                        🚶 {item.distance_from_prev}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    {item.name && (
                      <a
                        href={buildMapsUrl(item, place)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-high border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors text-sm"
                        title="Xem trên Google Maps"
                      >
                        📍
                      </a>
                    )}
                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-high border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors text-sm"
                        title="Đọc thêm"
                      >
                        🔗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href="/"
            className="neon-gradient text-on-primary font-label text-label-md uppercase tracking-widest px-8 py-4 rounded-full shadow-neon-green inline-block"
          >
            Tạo lịch trình của riêng bạn →
          </a>
        </div>
      </main>
    </div>
  )
}

export default function SharedItinerary({ token }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getShare(token)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-body-md text-on-surface-variant animate-pulse">Đang tải lịch trình...</p>
      </div>
    )
  }
  if (error) return <ExpiredState />
  return <ReadOnlyItinerary data={data} />
}
```

- [ ] **Step 2: Build để verify không lỗi**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
npm --prefix frontend run build 2>&1 | tail -5
```

Expected: build thành công.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SharedItinerary.jsx
git commit -m "feat: add SharedItinerary read-only component"
```

---

## Task 5: Wire App.jsx + share button in Itinerary

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Itinerary.jsx`

### Context

**App.jsx:** Hiện tại dùng state machine với `screen` state. Cần check `window.location.pathname` ở đầu component body — nếu path là `/share/{token}`, return `<SharedItinerary token={token} />` trực tiếp, bỏ qua toàn bộ logic auth.

**Itinerary.jsx:** Cần thêm nút "Chia sẻ" trong footer (cùng khu vực với nút "Lên kế hoạch lại"). Nút gọi `api.createShare(...)`, build URL, copy clipboard, hiện toast 2 giây.

`Itinerary` component nhận props: `recommendations`, `loading`, `tripType`, `location`, `onRestart`. Đủ để gọi createShare.

- [ ] **Step 1: Thêm SharedItinerary vào App.jsx**

Trong `frontend/src/App.jsx`:

1. Thêm import `SharedItinerary`:
```js
import SharedItinerary from './components/SharedItinerary.jsx'
```

2. Ở đầu function body `App()`, ngay sau khai báo các `useState`, thêm block check pathname. Đặt trước `useEffect`:

```js
  // Check share route before any auth logic
  const shareMatch = window.location.pathname.match(/^\/share\/(.+)$/)
  if (shareMatch) {
    return (
      <div className="min-h-screen bg-zinc-950 flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-background relative flex flex-col overflow-x-hidden">
          <SharedItinerary token={shareMatch[1]} />
        </div>
      </div>
    )
  }
```

- [ ] **Step 2: Thêm share button vào Itinerary.jsx**

Thêm `useState` cho toast (đã có `useState` trong import).

Trong `frontend/src/components/Itinerary.jsx`, sau `const [ratings, setRatings] = useState({})`, thêm:

```js
  const [shareToast, setShareToast] = useState(false)

  async function handleShare() {
    if (!recommendations) return
    try {
      const { token } = await api.createShare({
        places: recommendations.places || [],
        itinerary: recommendations.itinerary || [],
        location: location || '',
        trip_type: tripType || 'inday',
      })
      const url = `${window.location.origin}/share/${token}`
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        window.prompt('Copy link chia sẻ:', url)
      }
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    } catch (e) {
      console.warn('Share failed:', e)
    }
  }
```

Trong phần `{!loading && (...)}` footer (div chứa nút "Lên kế hoạch lại"), thêm nút Chia sẻ và toast. Thay thế:

```jsx
      {!loading && (
        <div className="sticky bottom-0 w-full px-container-margin pb-4 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
          <button
            onClick={onRestart}
            className="w-full bg-surface border-2 border-primary/30 text-primary py-4 rounded-full font-label text-label-md uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            Lên kế hoạch lại
          </button>
        </div>
      )}
```

Bằng:

```jsx
      {!loading && (
        <div className="sticky bottom-0 w-full px-container-margin pb-4 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
          {shareToast && (
            <div className="mb-3 bg-primary/10 border border-primary/30 text-primary font-label text-label-md text-center py-2 rounded-full">
              ✅ Đã copy link chia sẻ!
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 bg-surface border-2 border-primary/30 text-primary py-4 rounded-full font-label text-label-md uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">share</span>
              Chia sẻ
            </button>
            <button
              onClick={onRestart}
              className="flex-1 bg-surface border-2 border-primary/30 text-primary py-4 rounded-full font-label text-label-md uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">refresh</span>
              Lên kế hoạch lại
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 3: Build để verify**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
npm --prefix frontend run build 2>&1 | tail -5
```

Expected: build thành công, không lỗi.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/Itinerary.jsx
git commit -m "feat: wire share route in App.jsx and add share button to Itinerary"
```
