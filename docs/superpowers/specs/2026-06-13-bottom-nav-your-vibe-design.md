# Bottom Nav + Your Vibe Screen — Design Spec

**Date:** 2026-06-13

## Overview

Add a bottom navigation bar with 3 tabs and a new "Your Vibe" screen that shows the user's travel personality, category score breakdown, Unsplash photo suggestions, and insights derived from their place ratings.

---

## Navigation

### Structure
3 tabs, always rendered after login:
| Tab | Icon | Label | Screen |
|-----|------|-------|--------|
| 1 | 🧭 | Khám phá | Entry / Quiz / Vibe Result flow (current app) |
| 2 | ✨ | Your Vibe | New `YourVibeScreen` component |
| 3 | 📍 | Lịch trình | Itinerary (current `ItineraryScreen`) |

### Visibility rules
- Hidden during quiz flow (QUIZ1, QUIZ2 screens)
- Hidden on AUTH screen
- Visible on: ENTRY, VIBE_RESULT, ITINERARY, YOUR_VIBE

### Active tab
- Khám phá: active when screen is ENTRY or VIBE_RESULT
- Your Vibe: active when screen is YOUR_VIBE
- Lịch trình: active when screen is ITINERARY

### State management
`App.jsx` gains a `activeTab` string (default `'explore'`). Switching tabs updates `screen` state:
- `'explore'` → `'ENTRY'` (or `'VIBE_RESULT'` if recommendations exist)
- `'vibe'` → `'YOUR_VIBE'`
- `'itinerary'` → `'ITINERARY'`

---

## Your Vibe Screen

### Layout (Hero + Stats — Option A)

```
┌─────────────────────────────────┐
│  [big emoji]  Foodie Explorer   │
│  "Bạn sống để thưởng thức…"     │
│  Vibe từ: [date]                │
├─────────────────────────────────┤
│  Điểm vibe của bạn              │
│  ┌──────────┐  ┌──────────┐    │
│  │ 🍜 78%  │  │ 🗺️ 62%  │    │
│  │ Ăn uống  │  │ Khám phá │    │
│  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐    │
│  │ 🌿 45%  │  │ 🏛️ 30%  │    │
│  │  Relax   │  │ Văn hóa  │    │
│  └──────────┘  └──────────┘    │
├─────────────────────────────────┤
│  Địa điểm phù hợp với bạn       │
│  [← scroll ngang ảnh Unsplash →]│
├─────────────────────────────────┤
│  Đánh giá của bạn               │
│  👍 12 địa điểm Foodie           │
│  👍 5 địa điểm Explorer          │
│  👎 2 địa điểm Relax             │
└─────────────────────────────────┘
```

### Data sources
1. **Vibe scores** — from `vibeResult` in App.jsx state (already loaded from AgentBase on login)
2. **Place ratings** — fetched from backend `GET /api/vibe/ratings` → reads from AgentBase Memory
3. **Unsplash photos** — fetched client-side using `GET https://api.unsplash.com/search/photos?query=<keyword>&per_page=6`

### Unsplash keyword mapping
Each primary vibe maps to a search keyword:
| Vibe | Keyword |
|------|---------|
| Foodie | `street food vietnam` |
| Explorer | `mountain hiking vietnam` |
| Culture | `ancient temple vietnam` |
| Relax | `beach sunset vietnam` |
| Adventure | `waterfall trekking vietnam` |

Unsplash API key stored in frontend `.env` as `VITE_UNSPLASH_ACCESS_KEY`.

### Empty states
- No vibe yet → prompt user to take quiz ("Làm bài quiz để khám phá vibe của bạn")
- No ratings yet → show section but with placeholder text ("Chưa có đánh giá địa điểm nào")
- Unsplash fails → hide photo section silently

---

## Place Rating on Itinerary

### UI
Each place card in `ItineraryScreen` gains a rating row at the bottom:
```
[place info...]
──────────────────
👍 Thích    👎 Không hợp
```
Buttons highlight when selected. User can change their rating by tapping the other button.

### Data model
```json
{
  "placeId": "unique-place-id",
  "placeName": "Phố cổ Hội An",
  "category": "culture",
  "rating": "like" | "dislike",
  "ratedAt": "ISO timestamp"
}
```

### Storage
Ratings stored in AgentBase Memory via new backend endpoint:
- `POST /api/vibe/rate` — body: `{ placeId, placeName, category, rating }`
- `GET /api/vibe/ratings` — returns list of all user's ratings

AgentBase namespace for ratings: `/strategies/{strategyId}/actors/{userId}/ratings`

Uses the same `insert_memory_records_directly_async` pattern as vibe profiles, but in a separate namespace.

---

## Backend Changes

### New endpoints in `recommendations/router.py`
```
POST /api/vibe/rate        — save a place rating
GET  /api/vibe/ratings     — list all ratings for user
```

### New functions in `memory/service.py`
```python
async def save_place_rating(user_id: str, rating: dict) -> None
async def get_place_ratings(user_id: str) -> list[dict]
```

Ratings namespace: `f"/strategies/{AGENTBASE_STRATEGY_ID}/actors/{user_id}/ratings"`

---

## Frontend Changes

### New files
- `frontend/src/components/BottomNav.jsx` — 3-tab nav bar
- `frontend/src/screens/YourVibeScreen.jsx` — Your Vibe screen
- `frontend/src/hooks/useUnsplash.js` — custom hook for Unsplash photo fetch

### Modified files
- `frontend/src/App.jsx` — add `YOUR_VIBE` screen state, render `BottomNav`, handle tab switching
- `frontend/src/screens/ItineraryScreen.jsx` — add 👍/👎 rating buttons to each place card
- `frontend/src/api.js` — add `ratePlace` and `getRatings` methods

---

## Environment Variables

Frontend (`.env`):
```
VITE_UNSPLASH_ACCESS_KEY=<key>
```

Unsplash free tier: 50 req/hour — sufficient for hackathon use.

---

## Out of Scope
- Persisting Unsplash photos (fetched fresh each visit)
- Ratings affecting future AI recommendations (future feature)
- Rating history / edit history
