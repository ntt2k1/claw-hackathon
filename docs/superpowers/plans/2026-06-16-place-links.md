# Place Links (Google Maps + Source URL) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi địa điểm trong lịch trình hiển thị 2 icon link: 📍 Google Maps (frontend tự build) và 🔗 Source URL (LLM cung cấp).

**Architecture:** Thêm field `source_url` vào JSON schema prompt trong `tools.py`. Frontend build lookup map từ `places[]` để tra `source_url` theo tên, tự build Google Maps URL từ `name+address+district`, render 2 icon button trên mỗi itinerary card.

**Tech Stack:** Python/FastAPI backend, React 18 + TailwindCSS v3 frontend, LangChain ChatPromptTemplate.

---

## Files

| File | Thay đổi |
|------|----------|
| `backend/agent/tools.py` | Thêm `source_url` vào JSON schema trong human message prompt (dòng ~195) |
| `frontend/src/components/Itinerary.jsx` | Thêm `placeByName` lookup, `buildMapsUrl()`, và 2 icon buttons trên mỗi card |

---

## Task 1: Thêm `source_url` vào prompt schema (backend)

**Files:**
- Modify: `backend/agent/tools.py` (khoảng dòng 193–198, trong phần `"places": [...]` của JSON schema)

**Context:** File `tools.py` định nghĩa prompt LLM bằng `ChatPromptTemplate.from_messages`. Phần human message có một JSON schema mô tả output mong muốn. Cần thêm field `source_url` vào object mẫu trong mảng `places`.

Hiện tại schema `places` trông như sau (dòng ~187–198):
```python
  "places": [
    {{
      "name": "place name",
      "address": "specific street address",
      "district": "district/ward",
      "type": "food/sightseeing/activity/cafe/bar/nature",
      "description": "1-2 sentence description",
      "why_match": "one sentence why it matches the DNA",
      "best_for": "which axis fits best (e.g. Ẩm thực)",
      "price_range": "$ / $$ / $$$ / $$$$"
    }}
  ],
```

- [ ] **Step 1: Thêm `source_url` vào schema `places` và thêm rule vào STRICT RULES**

Trong `backend/agent/tools.py`, thay thế đoạn schema `places` trên bằng:

```python
  "places": [
    {{
      "name": "place name",
      "address": "specific street address",
      "district": "district/ward",
      "type": "food/sightseeing/activity/cafe/bar/nature",
      "description": "1-2 sentence description",
      "why_match": "one sentence why it matches the DNA",
      "best_for": "which axis fits best (e.g. Ẩm thực)",
      "price_range": "$ / $$ / $$$ / $$$$",
      "source_url": "a real verifiable URL to a review, article, or official page — empty string if uncertain"
    }}
  ],
```

Đồng thời trong phần `== STRICT RULES ==` của system message, sau dòng `- NEVER invent place names...`, thêm:

```
- For source_url: only include a real URL you are certain exists (official site, Foody, TripAdvisor, travel blog). Use empty string "" if uncertain — never fabricate a URL.
```

- [ ] **Step 2: Verify syntax không bị lỗi**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
python3 -m py_compile backend/agent/tools.py && echo "OK"
```

Expected output: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/agent/tools.py
git commit -m "feat: add source_url field to LLM place schema"
```

---

## Task 2: Render icon links trên Itinerary card (frontend)

**Files:**
- Modify: `frontend/src/components/Itinerary.jsx`

**Context:** Component nhận prop `recommendations` có shape `{ places: [...], itinerary: [...] }`. Mỗi item trong `itinerary` có `name`, `address`. Mỗi item trong `places` có `name`, `address`, `district`, `source_url`. Itinerary items và places liên kết qua field `name`.

Hiện tại mỗi card có phần rating buttons ở dòng ~86–115. Cần thêm 2 icon link sau/bên cạnh các rating buttons đó. Hai link render trong cùng row với rating buttons (dùng `ml-auto` để đẩy sang phải).

- [ ] **Step 1: Thêm helper `buildMapsUrl` và lookup map vào component**

Ở đầu function body `Itinerary` (sau `const [ratings, setRatings] = useState({})`), thêm:

```js
const placeByName = useMemo(
  () => Object.fromEntries((recommendations?.places || []).map(p => [p.name, p])),
  [recommendations]
)

function buildMapsUrl(item) {
  const place = placeByName[item.name] || {}
  const q = [item.name, item.address || place.address, place.district]
    .filter(Boolean)
    .join(' ')
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`
}
```

Và thêm `useMemo` vào import ở đầu file — hiện tại dòng 1 là:
```js
import { useEffect, useRef, useState } from 'react'
```
Đổi thành:
```js
import { useMemo, useState } from 'react'
```
(xoá `useEffect` và `useRef` nếu không còn dùng ở chỗ nào khác — kiểm tra trước khi xoá)

- [ ] **Step 2: Thêm 2 icon buttons vào mỗi card**

Trong phần rating div (dòng ~86, selector `<div className="mt-3 pt-3 border-t border-outline-variant flex gap-3">`), thêm icon links bằng cách thêm `items-center` và `ml-auto` wrapper:

Thay thế toàn bộ block:
```jsx
<div className="mt-3 pt-3 border-t border-outline-variant flex gap-3">
  {(() => {
    const placeId = `${i}-${(item.name || '').replace(/\s+/g, '-').toLowerCase()}`
    const current = ratings[placeId]
    return (
      <>
        <button
          onClick={() => handleRate(item, i, 'like')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
            current === 'like'
              ? 'bg-primary/10 border border-primary text-primary'
              : 'bg-surface-high border border-outline-variant text-on-surface-variant hover:border-primary/50'
          }`}
        >
          👍 <span>Thích</span>
        </button>
        <button
          onClick={() => handleRate(item, i, 'dislike')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
            current === 'dislike'
              ? 'bg-red-500/10 border border-red-500 text-red-400'
              : 'bg-surface-high border border-outline-variant text-on-surface-variant hover:border-red-500/50'
          }`}
        >
          👎 <span>Không hợp</span>
        </button>
      </>
    )
  })()}
</div>
```

Bằng:
```jsx
<div className="mt-3 pt-3 border-t border-outline-variant flex gap-3 items-center">
  {(() => {
    const placeId = `${i}-${(item.name || '').replace(/\s+/g, '-').toLowerCase()}`
    const current = ratings[placeId]
    const sourceUrl = placeByName[item.name]?.source_url
    return (
      <>
        <button
          onClick={() => handleRate(item, i, 'like')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
            current === 'like'
              ? 'bg-primary/10 border border-primary text-primary'
              : 'bg-surface-high border border-outline-variant text-on-surface-variant hover:border-primary/50'
          }`}
        >
          👍 <span>Thích</span>
        </button>
        <button
          onClick={() => handleRate(item, i, 'dislike')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
            current === 'dislike'
              ? 'bg-red-500/10 border border-red-500 text-red-400'
              : 'bg-surface-high border border-outline-variant text-on-surface-variant hover:border-red-500/50'
          }`}
        >
          👎 <span>Không hợp</span>
        </button>
        <div className="ml-auto flex gap-2">
          <a
            href={buildMapsUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-high border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors text-sm"
            title="Xem trên Google Maps"
          >
            📍
          </a>
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
      </>
    )
  })()}
</div>
```

- [ ] **Step 3: Kiểm tra import — xoá `useEffect` và `useRef` nếu không dùng**

```bash
grep -n "useEffect\|useRef" frontend/src/components/Itinerary.jsx
```

Nếu không còn xuất hiện ở nơi nào khác (chỉ trong import), xoá khỏi import line. Nếu vẫn còn dùng, giữ nguyên.

- [ ] **Step 4: Build frontend để kiểm tra lỗi TypeScript/import**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
npm --prefix frontend run build 2>&1 | tail -20
```

Expected: build thành công, không có lỗi đỏ.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Itinerary.jsx
git commit -m "feat: add Google Maps and source URL icon links to itinerary cards"
```
