# Bottom Nav + Your Vibe Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-tab bottom nav bar and a "Your Vibe" screen that shows personality stats, Unsplash photos, and place rating insights — with 👍/👎 rating buttons on each itinerary card.

**Architecture:** Backend gains two new endpoints (`POST /api/vibe/rate`, `GET /api/vibe/ratings`) backed by AgentBase Memory in a separate `/ratings` namespace. Frontend gains `BottomNav.jsx`, `YourVibeScreen.jsx`, and a `useUnsplash` hook; App.jsx gains a `YOUR_VIBE` screen state and wires tab navigation.

**Tech Stack:** React 18 + Vite, TailwindCSS (SOLE tokens: `primary=#ae2f34`, `bg-background=#faf7f4`), FastAPI + AgentBase SDK (`greennode_agentbase.memory.MemoryClient`), Unsplash REST API (client-side, `VITE_UNSPLASH_ACCESS_KEY`).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `backend/memory/service.py` | Modify | Add `save_place_rating`, `get_place_ratings` |
| `backend/recommendations/router.py` | Modify | Add `POST /api/vibe/rate`, `GET /api/vibe/ratings` |
| `frontend/src/api.js` | Modify | Add `ratePlace`, `getRatings` |
| `frontend/src/components/BottomNav.jsx` | Create | 3-tab bottom nav bar |
| `frontend/src/components/YourVibeScreen.jsx` | Create | Your Vibe screen (hero + stats + photos + insights) |
| `frontend/src/components/Itinerary.jsx` | Modify | Add 👍/👎 rating row to each place card |
| `frontend/src/App.jsx` | Modify | Add `YOUR_VIBE` screen, render BottomNav, handle tab switching |

---

### Task 1: Backend — Place Rating Memory Functions

**Files:**
- Modify: `backend/memory/service.py`

- [ ] **Step 1: Add `_ratings_namespace` helper and two new functions to `memory/service.py`**

Open `backend/memory/service.py`. The current content ends after `get_vibe_profile`. Append the following:

```python
def _ratings_namespace(user_id: str) -> str:
    return f"/strategies/{AGENTBASE_STRATEGY_ID}/actors/{user_id}/ratings"

async def save_place_rating(user_id: str, rating: dict) -> None:
    record_str = json.dumps(rating, ensure_ascii=False)
    await _client.insert_memory_records_directly_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_ratings_namespace(user_id),
        request={"memoryRecords": [record_str]},
    )

async def get_place_ratings(user_id: str) -> list[dict]:
    records = await _client.list_memory_records_async(
        id=AGENTBASE_MEMORY_ID,
        namespace=_ratings_namespace(user_id),
    )
    if not records:
        return []
    result = []
    for rec in records:
        raw = rec.get("memory", "") if isinstance(rec, dict) else getattr(rec, "memory", "")
        try:
            result.append(json.loads(raw))
        except (json.JSONDecodeError, TypeError):
            pass
    return result
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python -c "from memory.service import save_place_rating, get_place_ratings; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/memory/service.py
git commit -m "feat: add save_place_rating and get_place_ratings to memory service"
```

---

### Task 2: Backend — Rating API Endpoints

**Files:**
- Modify: `backend/recommendations/router.py`

- [ ] **Step 1: Add imports and Pydantic model**

At the top of `backend/recommendations/router.py`, add to the existing imports:

```python
from memory.service import save_vibe_profile, get_vibe_profile, save_place_rating, get_place_ratings
```

Then add the request model after the existing `RecommendationsRequest` class:

```python
class PlaceRatingRequest(BaseModel):
    placeId: str
    placeName: str
    category: str
    rating: str  # "like" | "dislike"
```

- [ ] **Step 2: Add the two new route handlers**

Append to `backend/recommendations/router.py` (after the existing `@router.post("/recommendations")` handler):

```python
@router.post("/vibe/rate")
async def rate_place(
    req: PlaceRatingRequest,
    user_id: str = Depends(get_current_user_id),
):
    from datetime import datetime, timezone
    rating = {
        "placeId": req.placeId,
        "placeName": req.placeName,
        "category": req.category,
        "rating": req.rating,
        "ratedAt": datetime.now(timezone.utc).isoformat(),
    }
    await save_place_rating(user_id, rating)
    return {"status": "ok"}

@router.get("/vibe/ratings")
async def list_ratings(user_id: str = Depends(get_current_user_id)):
    ratings = await get_place_ratings(user_id)
    return {"ratings": ratings}
```

- [ ] **Step 3: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/backend
python -c "from recommendations.router import router; print('OK')"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/recommendations/router.py
git commit -m "feat: add POST /api/vibe/rate and GET /api/vibe/ratings endpoints"
```

---

### Task 3: Frontend — API Methods

**Files:**
- Modify: `frontend/src/api.js`

- [ ] **Step 1: Add `ratePlace` and `getRatings` to the api object**

In `frontend/src/api.js`, add two entries inside the exported `api` object (after `recommendations`):

```javascript
ratePlace: (payload) => request('POST', '/vibe/rate', payload),
getRatings: () => request('GET', '/vibe/ratings'),
```

The full object should look like:

```javascript
export const api = {
  register: (email, password) => request('POST', '/auth/register', { email, password }),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  quizComplete: (payload) => request('POST', '/quiz/complete', payload),
  getVibe: () => request('GET', '/vibe'),
  recommendations: (payload) => request('POST', '/recommendations', payload),
  ratePlace: (payload) => request('POST', '/vibe/rate', payload),
  getRatings: () => request('GET', '/vibe/ratings'),
  saveToken: (token) => localStorage.setItem('sole_token', token),
  clearToken: () => localStorage.removeItem('sole_token'),
  hasToken: () => !!getToken(),
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api.js
git commit -m "feat: add ratePlace and getRatings to api.js"
```

---

### Task 4: Frontend — BottomNav Component

**Files:**
- Create: `frontend/src/components/BottomNav.jsx`

- [ ] **Step 1: Create `BottomNav.jsx`**

```jsx
const TABS = [
  { id: 'explore', icon: '🧭', label: 'Khám phá' },
  { id: 'vibe',    icon: '✨', label: 'Your Vibe' },
  { id: 'itinerary', icon: '📍', label: 'Lịch trình' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-white/20 shadow-lg">
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className={`font-label text-[10px] leading-none ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/BottomNav.jsx
git commit -m "feat: add BottomNav component with 3 tabs"
```

---

### Task 5: Frontend — YourVibeScreen Component

**Files:**
- Create: `frontend/src/components/YourVibeScreen.jsx`

- [ ] **Step 1: Create `YourVibeScreen.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { api } from '../api.js'

const VIBE_META = {
  Foodie:    { icon: '🍜', label: 'Foodie Explorer',   tagline: 'Bạn sống để thưởng thức — mỗi bữa ăn là một trải nghiệm', keyword: 'street food vietnam' },
  Explorer:  { icon: '🗺️', label: 'Explorer',          tagline: 'Mỗi chuyến đi là một trang nhật ký mới với bạn',          keyword: 'mountain hiking vietnam' },
  Culture:   { icon: '🏛️', label: 'Culture Lover',     tagline: 'Bạn tìm thấy linh hồn của nơi chốn qua lịch sử và nghệ thuật', keyword: 'ancient temple vietnam' },
  Relax:     { icon: '🌿', label: 'Chill Seeker',      tagline: 'Bạn cần sự tĩnh lặng — mỗi điểm đến là một nơi để thở',  keyword: 'beach sunset vietnam' },
  Adventure: { icon: '⚡', label: 'Adventure Seeker',  tagline: 'Adrenaline là nhiên liệu của bạn — càng thử thách càng thích', keyword: 'waterfall trekking vietnam' },
}

const SCORE_LABELS = {
  Foodie: '🍜 Ăn uống',
  Explorer: '🗺️ Khám phá',
  Culture: '🏛️ Văn hóa',
  Relax: '🌿 Nghỉ ngơi',
  Adventure: '⚡ Phiêu lưu',
}

function useUnsplash(keyword) {
  const [photos, setPhotos] = useState([])
  useEffect(() => {
    if (!keyword) return
    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
    if (!key) return
    fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=6&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${key}` },
    })
      .then(r => r.json())
      .then(data => setPhotos(data.results || []))
      .catch(() => {})
  }, [keyword])
  return photos
}

export default function YourVibeScreen({ vibeResult }) {
  const [ratings, setRatings] = useState([])

  useEffect(() => {
    api.getRatings()
      .then(data => setRatings(data.ratings || []))
      .catch(() => {})
  }, [])

  if (!vibeResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-20 text-center">
        <span className="text-5xl mb-4">✨</span>
        <h2 className="font-display text-headline-lg-mobile text-on-surface mb-2">Chưa có vibe</h2>
        <p className="font-body text-body-md text-on-surface-variant">Làm bài quiz để khám phá vibe du lịch của bạn nhé!</p>
      </div>
    )
  }

  const meta = VIBE_META[vibeResult.primary] || { icon: '✨', label: vibeResult.primary, tagline: '', keyword: 'vietnam travel' }
  const photos = useUnsplash(meta.keyword)

  // Aggregate ratings by category
  const ratingsByCategory = {}
  for (const r of ratings) {
    const cat = r.category || 'other'
    if (!ratingsByCategory[cat]) ratingsByCategory[cat] = { like: 0, dislike: 0 }
    ratingsByCategory[cat][r.rating === 'like' ? 'like' : 'dislike']++
  }

  const scores = vibeResult.scores || {}
  const maxScore = Math.max(...Object.values(scores), 1)
  const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-white/20 shadow-sm flex justify-center items-center h-16">
        <h1 className="font-display text-headline-lg-mobile text-primary tracking-tighter">SOLE</h1>
      </header>

      <main className="pt-20 px-5">
        {/* Hero */}
        <div className="mt-4 mb-6 text-center py-8 px-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
          <div className="text-6xl mb-3">{meta.icon}</div>
          <h2 className="font-display text-2xl text-primary font-bold mb-2">{meta.label}</h2>
          <p className="font-body text-body-md text-on-surface-variant italic">"{meta.tagline}"</p>
        </div>

        {/* Score grid */}
        <section className="mb-6">
          <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Điểm vibe của bạn</h3>
          <div className="grid grid-cols-2 gap-3">
            {scoreEntries.map(([vibe, score]) => {
              const pct = Math.round((score / maxScore) * 100)
              return (
                <div key={vibe} className="glass-card rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{VIBE_META[vibe]?.icon || '🌟'}</div>
                  <div className="font-label text-label-md text-primary font-semibold">{SCORE_LABELS[vibe] || vibe}</div>
                  <div className="mt-2 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="font-label text-caption text-on-surface-variant mt-1">{pct}%</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Unsplash photos */}
        {photos.length > 0 && (
          <section className="mb-6">
            <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Địa điểm phù hợp với bạn</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {photos.map(photo => (
                <div key={photo.id} className="flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={photo.urls.small}
                    alt={photo.alt_description || 'travel'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rating insights */}
        <section className="mb-6">
          <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Đánh giá của bạn</h3>
          {ratings.length === 0 ? (
            <p className="font-body text-body-md text-on-surface-variant text-center py-4">Chưa có đánh giá địa điểm nào</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(ratingsByCategory).map(([cat, counts]) => (
                <div key={cat} className="glass-card rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="font-body text-body-md text-on-surface capitalize">{SCORE_LABELS[cat] || cat}</span>
                  <div className="flex gap-3 text-sm">
                    {counts.like > 0 && <span>👍 {counts.like}</span>}
                    {counts.dislike > 0 && <span>👎 {counts.dislike}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/YourVibeScreen.jsx
git commit -m "feat: add YourVibeScreen with hero, score grid, Unsplash photos, and rating insights"
```

---

### Task 6: Frontend — Rating UI on Itinerary Cards

**Files:**
- Modify: `frontend/src/components/Itinerary.jsx`

- [ ] **Step 1: Add rating state and handler to `Itinerary.jsx`**

At the top of the `Itinerary` component function (after the existing props), add:

```javascript
const [ratings, setRatings] = useState({})

async function handleRate(item, index, rating) {
  const placeId = `${index}-${(item.name || '').replace(/\s+/g, '-').toLowerCase()}`
  setRatings(prev => ({ ...prev, [placeId]: rating }))
  try {
    await api.ratePlace({
      placeId,
      placeName: item.name || '',
      category: item.category || 'general',
      rating,
    })
  } catch (e) {
    console.warn('Rating failed:', e)
  }
}
```

Also add the import at the top:
```javascript
import { api } from '../api.js'
```

- [ ] **Step 2: Add rating buttons inside each place card**

Inside the `glass-card` div for each itinerary item (after the existing `flex gap-3 flex-wrap` div), add:

```jsx
{/* Rating row */}
<div className="mt-3 pt-3 border-t border-white/20 flex gap-3">
  {(() => {
    const placeId = `${i}-${(item.name || '').replace(/\s+/g, '-').toLowerCase()}`
    const current = ratings[placeId]
    return (
      <>
        <button
          onClick={() => handleRate(item, i, 'like')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
            current === 'like'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-white/50 text-on-surface-variant border border-white/30 hover:bg-green-50'
          }`}
        >
          👍 <span>Thích</span>
        </button>
        <button
          onClick={() => handleRate(item, i, 'dislike')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
            current === 'dislike'
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-white/50 text-on-surface-variant border border-white/30 hover:bg-red-50'
          }`}
        >
          👎 <span>Không hợp</span>
        </button>
      </>
    )
  })()}
</div>
```

The full updated card structure should look like:

```jsx
<div className="glass-card flex-1 rounded-lg p-stack-md mb-2">
  <div className="flex justify-between items-start mb-1">
    <p className="font-display text-headline-md text-on-surface leading-tight">
      {item.time && <span className="text-primary mr-2">{item.time}</span>}
      {item.name}
    </p>
  </div>
  {item.description && (
    <p className="font-body text-body-md text-on-surface-variant mb-2">
      {item.description}
    </p>
  )}
  <div className="flex gap-3 flex-wrap">
    {item.duration_note && (
      <span className="font-label text-caption bg-primary/10 text-primary px-3 py-1 rounded-full">
        ⏱ {item.duration_note}
      </span>
    )}
    {item.distance_from_prev && (
      <span className="font-label text-caption bg-tertiary/10 text-tertiary px-3 py-1 rounded-full">
        📍 {item.distance_from_prev}
      </span>
    )}
  </div>
  {/* Rating row */}
  <div className="mt-3 pt-3 border-t border-white/20 flex gap-3">
    {(() => {
      const placeId = `${i}-${(item.name || '').replace(/\s+/g, '-').toLowerCase()}`
      const current = ratings[placeId]
      return (
        <>
          <button
            onClick={() => handleRate(item, i, 'like')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
              current === 'like'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white/50 text-on-surface-variant border border-white/30 hover:bg-green-50'
            }`}
          >
            👍 <span>Thích</span>
          </button>
          <button
            onClick={() => handleRate(item, i, 'dislike')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label transition-colors ${
              current === 'dislike'
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-white/50 text-on-surface-variant border border-white/30 hover:bg-red-50'
            }`}
          >
            👎 <span>Không hợp</span>
          </button>
        </>
      )
    })()}
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Itinerary.jsx
git commit -m "feat: add thumbs up/down rating buttons to itinerary place cards"
```

---

### Task 7: Frontend — Wire App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add new imports**

Add to the top imports in `frontend/src/App.jsx`:

```javascript
import BottomNav from './components/BottomNav.jsx'
import YourVibeScreen from './components/YourVibeScreen.jsx'
```

- [ ] **Step 2: Add `activeTab` state**

Inside the `App` function, after the existing `useState` declarations, add:

```javascript
const [activeTab, setActiveTab] = useState('explore')
```

- [ ] **Step 3: Add `handleTabChange` function**

After `handleRetakeQuiz`, add:

```javascript
function handleTabChange(tab) {
  setActiveTab(tab)
  if (tab === 'explore') {
    setScreen(recommendations ? 'VIBE' : 'ENTRY')
  } else if (tab === 'vibe') {
    setScreen('YOUR_VIBE')
  } else if (tab === 'itinerary') {
    setScreen('ITINERARY')
  }
}
```

- [ ] **Step 4: Sync `activeTab` when screen changes**

Replace `handleRestart` with:

```javascript
function handleRestart() {
  setSingleAnswers({})
  setRatingAnswers({})
  setRecommendations(null)
  setActiveTab('explore')
  setScreen('ENTRY')
}
```

Also update `handleGetRecommendationsWithEntry` — after `setScreen('ITINERARY')` add:
```javascript
setActiveTab('itinerary')
```

And `handleGetRecommendations` — after `setScreen('ITINERARY')` add:
```javascript
setActiveTab('itinerary')
```

- [ ] **Step 5: Add `YOUR_VIBE` to the render block and add `BottomNav`**

Replace the current `return` block with:

```jsx
const showNav = !['AUTH', 'QUIZ1', 'QUIZ2', 'QUIZ3'].includes(screen)

return (
  <div className="min-h-screen bg-background">
    {screen === 'AUTH'       && <AuthScreen onSuccess={handleAuthSuccess} />}
    {screen === 'ENTRY'      && <EntryScreen user={user} vibeResult={vibeResult} onDone={handleEntryDone} onRetakeQuiz={handleRetakeQuiz} />}
    {screen === 'QUIZ1'      && <QuizScreen questions={screen1Qs} screenIndex={1} totalScreens={3} onDone={handleQuiz1Done} />}
    {screen === 'QUIZ2'      && <QuizScreen questions={screen2Qs} screenIndex={2} totalScreens={3} onDone={handleQuiz2Done} />}
    {screen === 'QUIZ3'      && <RatingScreen screenIndex={3} totalScreens={3} onDone={handleQuiz3Done} />}
    {screen === 'VIBE'       && <VibeResult vibeResult={vibeResult} onContinue={handleGetRecommendations} />}
    {screen === 'ITINERARY'  && <Itinerary recommendations={recommendations} loading={loadingRec} tripType={tripType} location={location} onRestart={handleRestart} />}
    {screen === 'YOUR_VIBE'  && <YourVibeScreen vibeResult={vibeResult} />}
    {showNav && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
  </div>
)
```

- [ ] **Step 6: Verify the app builds**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no errors (warnings about unused vars are ok).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: wire BottomNav and YourVibeScreen into App, add YOUR_VIBE screen state"
```

---

### Task 8: Environment Variable + Manual Smoke Test

**Files:**
- Modify: `frontend/.env` (add Unsplash key — value provided by user)

- [ ] **Step 1: Add Unsplash key to `.env`**

In `frontend/.env`, add:

```
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

Get a free key at https://unsplash.com/developers (Create App → Access Key). If skipping for now, photos section will just be hidden silently.

- [ ] **Step 2: Start dev server and smoke test**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
# Start backend
cd backend && uvicorn main:app --host 0.0.0.0 --port 8080 --reload &
# Start frontend
cd ../frontend && npm run dev
```

Open http://localhost:5173 and verify:

**Nav bar:**
- [ ] Nav bar NOT visible on login/register screen
- [ ] Nav bar NOT visible during quiz (QUIZ1/QUIZ2/QUIZ3)
- [ ] Nav bar visible on Entry, Itinerary, Your Vibe screens
- [ ] Active tab highlighted with dot indicator

**Your Vibe screen:**
- [ ] Tapping ✨ Your Vibe tab shows the screen
- [ ] Hero shows correct emoji + vibe name + tagline for the logged-in user's primary vibe
- [ ] Score grid shows all vibe categories with progress bars
- [ ] Photos section shows Unsplash images (if key configured)
- [ ] "Chưa có đánh giá địa điểm nào" shown when no ratings exist

**Itinerary rating:**
- [ ] Each place card shows 👍 Thích and 👎 Không hợp buttons
- [ ] Tapping 👍 highlights that button in green
- [ ] Tapping 👎 highlights that button in red, deselects 👍
- [ ] After rating, switching to Your Vibe shows insights

- [ ] **Step 3: Commit**

```bash
git add frontend/.env
git commit -m "chore: add VITE_UNSPLASH_ACCESS_KEY to frontend env"
```
