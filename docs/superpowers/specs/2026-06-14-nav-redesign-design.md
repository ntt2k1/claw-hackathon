# SOLE Navigation & UI Redesign — Design Spec

## Goal

Redesign the 3-tab navigation to: Home (landing) → Explore (with mood + budget inputs) → DNA (radar chart). Translate backend prompts to English and inject user_need + budget into recommendations.

## Architecture

- **New component:** `HomeScreen.jsx` — landing page with floating orb animation
- **Modified components:** `EntryScreen.jsx`, `YourVibeScreen.jsx`, `BottomNav.jsx`, `App.jsx`
- **New dependency:** `recharts` (radar chart)
- **Backend changes:** `tools.py` (English prompts + user_need/budget), `executor.py`, `router.py`

## Tech Stack

React 18 + Vite, TailwindCSS v3, Recharts, FastAPI, plain JS (no TypeScript)

---

## Section 1 — BottomNav Restructure

**Old tabs:** Explore / Vibe / Itinerary
**New tabs:**

| Tab | Label | Icon | Screen key |
|-----|-------|------|------------|
| 0 | Trang chủ | 🏠 | `HOME` |
| 1 | Khám phá | 🧭 | `ENTRY` |
| 2 | DNA | 🧬 | `YOUR_VIBE` |

- Remove `ITINERARY` tab from nav. Itinerary remains a fullscreen overlay pushed from EntryScreen.
- `showNav` logic stays the same: hide during `AUTH`, `QUIZ1`, `QUIZ2`.
- Active tab indicator: acid green dot below icon (existing pattern).

**BottomNav.jsx changes:**
- Replace the 3 tab definitions with the new set above.
- `onTabChange('home')` → `setScreen('HOME')`
- `onTabChange('explore')` → `setScreen('ENTRY')`
- `onTabChange('dna')` → `setScreen('YOUR_VIBE')`

---

## Section 2 — HomeScreen (new file: `src/components/HomeScreen.jsx`)

### Layout

Full screen, `bg-background`, centered content, floating orb layer behind.

```
[Floating orbs — fixed, -z-10]
[Center column — flex col items-center justify-center min-h-screen px-6]
  [SOLE wordmark — text-7xl font-black text-primary tracking-tighter]
  [Tagline — "Tìm tọa độ theo DNA du lịch của bạn" — text-on-surface-variant]
  [Persona badge — if vibeResult exists: "✨ {persona}" pill in primary/10 border]
  [CTA button — "Khám phá ngay →" — neon-gradient rounded-full]
  [Sub-link — if no vibe: "Chưa có DNA? Làm quiz →" — text-caption underline]
```

### Floating Orbs Animation

4 orbs, CSS `@keyframes float-orb-N` per orb, each with unique duration and translate path. Defined in `index.css`.

```css
/* Add to index.css */
@keyframes float-orb-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(40px, -60px) scale(1.1); }
  66%       { transform: translate(-30px, 40px) scale(0.9); }
}
@keyframes float-orb-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(-50px, -40px) scale(1.15); }
}
@keyframes float-orb-3 {
  0%, 100% { transform: translate(0, 0); }
  40%       { transform: translate(60px, 50px) scale(0.85); }
  80%       { transform: translate(-20px, -30px) scale(1.05); }
}
@keyframes float-orb-4 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  60%       { transform: translate(-40px, 60px) scale(1.2); }
}
```

Orb classes:
```jsx
// orb-1: top-right, acid green, 400px, 14s
// orb-2: bottom-left, cyber purple, 350px, 18s
// orb-3: top-left, acid green, 250px, 11s
// orb-4: bottom-right, cyber purple, 300px, 20s
<div className="fixed top-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-primary/20 blur-3xl -z-10" style={{animation: 'float-orb-1 14s ease-in-out infinite'}} />
<div className="fixed bottom-[-80px] left-[-60px] w-[350px] h-[350px] rounded-full bg-cyber-purple/20 blur-3xl -z-10" style={{animation: 'float-orb-2 18s ease-in-out infinite'}} />
<div className="fixed top-[20%] left-[-40px] w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl -z-10" style={{animation: 'float-orb-3 11s ease-in-out infinite'}} />
<div className="fixed bottom-[20%] right-[-30px] w-[300px] h-[300px] rounded-full bg-cyber-purple/15 blur-3xl -z-10" style={{animation: 'float-orb-4 20s ease-in-out infinite'}} />
```

### CTA Logic

```js
function handleExplore() {
  if (!vibeResult) {
    onStartQuiz()   // → setScreen('QUIZ1')
  } else {
    onGoExplore()   // → setScreen('ENTRY'), setActiveTab('explore')
  }
}
```

Props: `{ vibeResult, user, onStartQuiz, onGoExplore }`

---

## Section 3 — EntryScreen Additions

### New fields (add below existing duration slider, above location input)

**"Nhu cầu / tâm trạng"** — optional textarea:
```jsx
<textarea
  rows={2}
  placeholder="VD: Mình đang mệt, muốn tìm chỗ yên tĩnh uống cà phê và đọc sách..."
  value={userNeed}
  onChange={e => setUserNeed(e.target.value)}
  className="w-full bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary resize-none"
/>
```

**"Ngân sách"** — quick-select pills + optional manual input:

Quick-select values: `['500K', '1M', '2M', '5M', '10M+']`

```jsx
const BUDGET_OPTS = ['500K', '1M', '2M', '5M', '10M+']
// Each pill: selected = bg-primary/10 border-primary text-primary, else bg-surface border-outline-variant text-on-surface-variant
```

Manual input: shown when no pill selected, `type="number"` with `placeholder="Nhập số tiền..."`, unit label "VNĐ".

State:
```js
const [userNeed, setUserNeed] = useState('')
const [budget, setBudget] = useState('')      // e.g. '1M' or '1500000'
const [budgetPill, setBudgetPill] = useState('') // selected pill label
```

### Pass to onDone
```js
onDone({ tripType, location, duration, userNeed, budget: budgetPill || budget })
```

### App.jsx — forward to recommendations
Both `handleEntryDone` paths pass `user_need` and `budget` to `api.recommendations()`.

---

## Section 4 — YourVibeScreen → DNA Screen

### Install recharts
```bash
cd frontend && npm install recharts
```

### Radar Chart

Replace the 2-column score grid with a Recharts `RadarChart`.

```jsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

// Data shape:
const radarData = Object.entries(scores).map(([axis, value]) => ({
  axis,
  value,
  fullMark: 100,
}))

<ResponsiveContainer width="100%" height={300}>
  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
    <PolarGrid stroke="#514255" />
    <PolarAngleAxis
      dataKey="axis"
      tick={{ fill: '#888888', fontSize: 11, fontFamily: 'Montserrat' }}
    />
    <Radar
      dataKey="value"
      stroke="#00FFA3"
      fill="#00FFA3"
      fillOpacity={0.25}
      strokeWidth={2}
    />
  </RadarChart>
</ResponsiveContainer>
```

Wrap in a `bg-surface border border-outline-variant rounded-xl p-4` card.

### "Đổi tần số" Button

Replace the current small underline link with a prominent outlined button:

```jsx
<button
  onClick={onRetakeQuiz}
  className="w-full py-3 rounded-full border-2 border-cyber-purple text-cyber-purple font-label text-label-md uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
>
  ⚡ Đổi tần số
</button>
```

Place immediately below the radar chart card.

### DNA Screen Layout (top to bottom)
1. Fixed header (SOLE logo)
2. Hero card (persona icon, name, tagline)
3. Radar chart card
4. "⚡ Đổi tần số" button
5. Unsplash photos row (if any)
6. Rating insights section
7. Account email + logout

### Props change
`YourVibeScreen` needs `onRetakeQuiz` prop passed from `App.jsx`.

---

## Section 5 — Backend: English Prompts + user_need/budget

### router.py — RecommendationsRequest

```python
class RecommendationsRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    location: str
    trip_type: str
    duration: int = 8
    persona: str | None = None
    scores: dict[str, int] | None = None
    user_need: str | None = None   # NEW
    budget: str | None = None      # NEW — e.g. "1M", "500K", "10M+"
```

Pass `user_need` and `budget` through to `run_recommendation_pipeline`.

### executor.py

```python
async def run_recommendation_pipeline(
    primary_vibe, secondary_vibe, location, trip_type, duration,
    persona=None, axes=None,
    user_need=None, budget=None,   # NEW
) -> dict:
    ...
    places = await search_locations(resolved_persona, resolved_axes, location, trip_type, user_need, budget)
```

### tools.py — English prompts + budget/need injection

**search_locations** system prompt (English):

```python
system_prompt = """You are a Vietnam travel expert with up-to-date, real-world local knowledge.

STRICT RULES:
1. ONLY suggest places you are CERTAIN exist right now
2. NEVER invent or hallucinate place names, addresses, or districts
3. MUST include specific address (street + district/ward)
4. If uncertain about a place, omit it entirely
5. Return 6-8 places maximum

Output: valid JSON array only, no markdown, no explanation."""
```

**Human message** (English, with optional injections):

```python
need_line = f"\nUser's current mood/need: {user_need}" if user_need else ""
budget_line = f"\nTotal budget: {budget} VND" if budget else ""

human_msg = f"""Find places in {location} for a {trip_type} trip.

Traveler DNA persona: {persona}
Top travel axes:
{axes_context}
{need_line}
{budget_line}

Return JSON array of objects with fields:
name, address, district, type, description, why_match, best_for, price_range"""
```

**build_itinerary** system prompt (English):

```python
system_prompt = "You are a Vietnam trip itinerary planner. Return pure JSON array only, no markdown."
```

Human message stays structured, translated to English. `description` and place names remain Vietnamese proper nouns as LLM will naturally use them.

---

## App.jsx Changes Summary

```js
// New screen state: 'HOME'
// Initial screen after login: 'HOME' (was 'ENTRY')
// handleTabChange: 'home' → 'HOME', 'explore' → 'ENTRY', 'dna' → 'YOUR_VIBE'
// HomeScreen props: vibeResult, user, onStartQuiz=()=>setScreen('QUIZ1'), onGoExplore=()=>{setScreen('ENTRY');setActiveTab('explore')}
// YourVibeScreen props: add onRetakeQuiz={handleRetakeQuiz}
// handleEntryDone: forward userNeed, budget to recommendations call
// showNav: hide during AUTH, QUIZ1, QUIZ2 (same as now)
```

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `frontend/src/components/HomeScreen.jsx` |
| Modify | `frontend/src/components/BottomNav.jsx` |
| Modify | `frontend/src/components/EntryScreen.jsx` |
| Modify | `frontend/src/components/YourVibeScreen.jsx` |
| Modify | `frontend/src/App.jsx` |
| Modify | `frontend/src/index.css` (orb keyframes) |
| Modify | `backend/recommendations/router.py` |
| Modify | `backend/agent/executor.py` |
| Modify | `backend/agent/tools.py` |
| Run | `cd frontend && npm install recharts` |
