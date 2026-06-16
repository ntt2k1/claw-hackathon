# Place Links (Google Maps + Source URL) — Design Spec

## Goal

Mỗi địa điểm trong lịch trình hiển thị 2 icon link nhỏ: 📍 Google Maps và 🔗 Source (bài review/giới thiệu). Google Maps URL được frontend tự build, source URL do LLM cung cấp.

## Architecture

Thay đổi tối thiểu — chỉ 2 file:
- `backend/agent/tools.py` — thêm field `source_url` vào JSON schema prompt
- `frontend/src/components/Itinerary.jsx` — render 2 icon link trên mỗi card

## Backend

### Thay đổi prompt schema (`tools.py`)

Thêm field `source_url` vào mảng `places` trong phần JSON schema của human message:

```
"source_url": "a real, verifiable URL to a review, article, or official page about this place — use empty string if uncertain"
```

**Hướng dẫn LLM (thêm vào STRICT RULES):**
- Ưu tiên nguồn: trang chính thức, Foody, TripAdvisor, blog du lịch uy tín
- Nếu không chắc URL tồn tại → để `""`, tuyệt đối không bịa URL
- `source_url` là optional — không bắt buộc phải có cho mọi địa điểm

### Không thay đổi

- API contract (`/api/recommendations`) — response shape giữ nguyên, `source_url` là field mới trong mỗi object của `places[]`
- Executor, router, memory service — không động vào

## Frontend

### Lookup map

Trong `Itinerary.jsx`, build lookup map từ `recommendations.places`:

```js
const placeByName = useMemo(() =>
  Object.fromEntries((recommendations?.places || []).map(p => [p.name, p])),
  [recommendations]
)
```

### Google Maps URL

Tự build từ `name + address + district` của place:

```js
function buildMapsUrl(place) {
  const q = [place.name, place.address, place.district].filter(Boolean).join(' ')
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`
}
```

### UI — 2 icon buttons

Mỗi itinerary card, thêm vào góc dưới phải:

```jsx
<div className="flex gap-2 mt-2 justify-end">
  <a href={buildMapsUrl(place)} target="_blank" rel="noopener noreferrer"
     className="...icon button styles...">
    📍
  </a>
  {place?.source_url && (
    <a href={place.source_url} target="_blank" rel="noopener noreferrer"
       className="...icon button styles...">
      🔗
    </a>
  )}
</div>
```

**Styling**: nhỏ gọn, nền `bg-surface-high`, border `border-outline-variant`, rounded, padding `p-1.5`, text size `text-sm`. Hover state nhẹ.

**Vị trí**: góc dưới phải của label box (phần text, không phải ảnh), cùng hàng với rating buttons hoặc bên dưới tùy layout hiện tại.

## Edge cases

- `source_url` rỗng (`""`) hoặc `null` → không render 🔗 button
- Place lookup miss (tên trong itinerary không khớp places) → chỉ render 📍 (Maps URL vẫn build được từ `item.name + item.address`)
- URL không hợp lệ từ LLM → `target="_blank"` vẫn mở, browser tự xử lý

## Scope

| File | Thay đổi |
|------|----------|
| `backend/agent/tools.py` | Thêm `source_url` vào JSON schema + thêm 1 dòng STRICT RULE |
| `frontend/src/components/Itinerary.jsx` | Thêm lookup map + `buildMapsUrl` + 2 icon buttons trên mỗi card |
