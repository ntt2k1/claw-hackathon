# SOLE Navigation & UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign nav to 3 tabs (Home / Khám phá / DNA), add HomeScreen landing page with orb animation, add mood + budget inputs to EntryScreen, upgrade YourVibeScreen with Recharts radar chart, and translate backend prompts to English with user_need/budget injection.

**Architecture:** New `HomeScreen.jsx` landing page; BottomNav tabs swapped to home/explore/dna; EntryScreen gets 2 new optional inputs forwarded to backend; YourVibeScreen score grid replaced by Recharts RadarChart; backend `tools.py` prompts translated to English with conditional need/budget lines injected.

**Tech Stack:** React 18 + Vite, TailwindCSS v3, Recharts (new dep), FastAPI, plain JS

---

## Task 1: Install recharts + add orb keyframes to CSS

**Files:**
- Run: `cd frontend && npm install recharts`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Install recharts**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm install recharts
```

Expected output: `added N packages` with recharts in node_modules.

- [ ] **Step 2: Verify recharts installed**

```bash
grep '"recharts"' /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend/package.json
```

Expected: `"recharts": "^2.x.x"`

- [ ] **Step 3: Add orb keyframes to index.css**

Read `frontend/src/index.css` first, then append after the existing `.animate-float` block:

```css
/* Floating orb animations for HomeScreen */
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

- [ ] **Step 4: Verify build passes**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/index.css
git commit -m "feat: install recharts, add float-orb keyframes"
```

---

## Task 2: Create HomeScreen.jsx

**Files:**
- Create: `frontend/src/components/HomeScreen.jsx`

- [ ] **Step 1: Create the file**

```jsx
export default function HomeScreen({ vibeResult, user, onStartQuiz, onGoExplore }) {
  function handleExplore() {
    if (!vibeResult) {
      onStartQuiz()
    } else {
      onGoExplore()
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Floating orbs */}
      <div
        className="fixed top-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-primary/20 blur-3xl -z-10 pointer-events-none"
        style={{ animation: 'float-orb-1 14s ease-in-out infinite' }}
      />
      <div
        className="fixed bottom-[-80px] left-[-60px] w-[350px] h-[350px] rounded-full bg-cyber-purple/20 blur-3xl -z-10 pointer-events-none"
        style={{ animation: 'float-orb-2 18s ease-in-out infinite' }}
      />
      <div
        className="fixed top-[20%] left-[-40px] w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl -z-10 pointer-events-none"
        style={{ animation: 'float-orb-3 11s ease-in-out infinite' }}
      />
      <div
        className="fixed bottom-[20%] right-[-30px] w-[300px] h-[300px] rounded-full bg-cyber-purple/15 blur-3xl -z-10 pointer-events-none"
        style={{ animation: 'float-orb-4 20s ease-in-out infinite' }}
      />

      {/* Center content */}
      <div className="flex flex-col items-center text-center gap-5 pb-24">
        <h1 className="text-7xl font-black text-primary tracking-tighter leading-none">
          SOLE
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-xs leading-snug">
          Tìm tọa độ theo DNA du lịch của bạn
        </p>

        {vibeResult && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2">
            <span className="text-lg">✨</span>
            <span className="font-label text-label-md text-primary">{vibeResult.persona}</span>
          </div>
        )}

        <button
          onClick={handleExplore}
          className="neon-gradient text-on-primary font-label text-label-md uppercase tracking-widest px-8 py-4 rounded-full shadow-neon-green active:scale-95 transition-transform mt-2"
        >
          Khám phá ngay →
        </button>

        {!vibeResult && (
          <button
            onClick={onStartQuiz}
            className="font-label text-caption text-on-surface-variant underline underline-offset-4"
          >
            Chưa có DNA? Làm quiz →
          </button>
        )}

        {user && (
          <p className="font-label text-caption text-on-surface-dim/50 mt-4">
            {user.email}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/HomeScreen.jsx
git commit -m "feat: add HomeScreen with floating orb animation"
```

---

## Task 3: Update BottomNav tabs

**Files:**
- Modify: `frontend/src/components/BottomNav.jsx`

Current TABS: `explore / vibe / itinerary`
New TABS: `home / explore / dna`

- [ ] **Step 1: Rewrite BottomNav.jsx**

Read `frontend/src/components/BottomNav.jsx` first, then replace the TABS constant:

```jsx
const TABS = [
  { id: 'home',    icon: '🏠', label: 'Trang chủ' },
  { id: 'explore', icon: '🧭', label: 'Khám phá' },
  { id: 'dna',     icon: '🧬', label: 'DNA' },
]
```

Keep the rest of the component (map over TABS, active indicator dot) exactly the same.

- [ ] **Step 2: Verify build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/BottomNav.jsx
git commit -m "feat: update BottomNav to home/explore/dna tabs"
```

---

## Task 4: Update App.jsx — wire HomeScreen + new tab routing

**Files:**
- Modify: `frontend/src/App.jsx`

Changes needed:
1. Import `HomeScreen`
2. Add `'HOME'` screen state; initial screen after login → `'HOME'`
3. `handleAuthSuccess` → `setScreen('HOME')`
4. `useEffect` after token restore → `setScreen('HOME')`
5. `handleTabChange`: `'home'` → `'HOME'`, `'explore'` → `'ENTRY'`, `'dna'` → `'YOUR_VIBE'`; remove `'vibe'` and `'itinerary'` cases
6. `handleRestart` → `setActiveTab('home')`, `setScreen('HOME')`
7. `showNav` still hides during `AUTH`, `QUIZ1`, `QUIZ2`
8. Render `HomeScreen` when `screen === 'HOME'`
9. Pass `onRetakeQuiz={handleRetakeQuiz}` to `YourVibeScreen`
10. `activeTab` initial value → `'home'`

- [ ] **Step 1: Read App.jsx**

Read `frontend/src/App.jsx` fully (already done above — use the current content).

- [ ] **Step 2: Apply all App.jsx changes**

Replace the import block at top, add HomeScreen import:
```js
import HomeScreen from './components/HomeScreen.jsx'
```

Change initial activeTab:
```js
const [activeTab, setActiveTab] = useState('home')
```

Change `useEffect` final setScreen call (line 44):
```js
setScreen('HOME')
```

Change `handleAuthSuccess`:
```js
function handleAuthSuccess(userData) {
  setUser(userData)
  setScreen('HOME')
}
```

Change `handleRestart`:
```js
function handleRestart() {
  setQuizAnswers([])
  setRecommendations(null)
  setActiveTab('home')
  setScreen('HOME')
}
```

Replace `handleTabChange`:
```js
function handleTabChange(tab) {
  setActiveTab(tab)
  if (tab === 'home') {
    setScreen('HOME')
  } else if (tab === 'explore') {
    setScreen('ENTRY')
  } else if (tab === 'dna') {
    setScreen('YOUR_VIBE')
  }
}
```

Add `HOME` screen render and update `YOUR_VIBE` to pass `onRetakeQuiz`:
```jsx
{screen === 'HOME' && (
  <HomeScreen
    vibeResult={vibeResult}
    user={user}
    onStartQuiz={() => setScreen('QUIZ1')}
    onGoExplore={() => { setScreen('ENTRY'); setActiveTab('explore') }}
  />
)}
{screen === 'YOUR_VIBE' && (
  <YourVibeScreen vibeResult={vibeResult} user={user} onLogout={handleLogout} onRetakeQuiz={handleRetakeQuiz} />
)}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: wire HomeScreen into App, update tab routing to home/explore/dna"
```

---

## Task 5: Add mood + budget inputs to EntryScreen

**Files:**
- Modify: `frontend/src/components/EntryScreen.jsx`

- [ ] **Step 1: Read EntryScreen.jsx**

Read `frontend/src/components/EntryScreen.jsx` fully.

- [ ] **Step 2: Add new state and BUDGET_OPTS constant**

Add after the existing `useState` declarations (after `const [error, setError] = useState('')`):

```js
const BUDGET_OPTS = ['500K', '1M', '2M', '5M', '10M+']
const [userNeed, setUserNeed] = useState('')
const [budgetPill, setBudgetPill] = useState('')
const [budgetCustom, setBudgetCustom] = useState('')
```

- [ ] **Step 3: Update handleContinue to pass new fields**

Replace:
```js
onDone({ tripType, location: location.trim(), duration })
```
With:
```js
onDone({
  tripType,
  location: location.trim(),
  duration,
  userNeed: userNeed.trim(),
  budget: budgetPill || budgetCustom,
})
```

- [ ] **Step 4: Add the two new input sections in JSX**

Insert the following block **between** the duration slider section and the location input section (after the closing `</div>` of the duration slider, before `<div className="mb-stack-md">` for location):

```jsx
{/* Nhu cầu / tâm trạng */}
<div className="mb-stack-md">
  <label className="font-label text-label-md text-on-surface-variant mb-2 block">
    💭 Nhu cầu / tâm trạng của bạn <span className="text-on-surface-dim/50">(tùy chọn)</span>
  </label>
  <textarea
    rows={2}
    placeholder="VD: Mình đang mệt, muốn tìm chỗ yên tĩnh uống cà phê và đọc sách..."
    value={userNeed}
    onChange={e => setUserNeed(e.target.value)}
    className="w-full bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary resize-none transition-colors"
  />
</div>

{/* Ngân sách */}
<div className="mb-stack-md">
  <label className="font-label text-label-md text-on-surface-variant mb-2 block">
    💰 Ngân sách <span className="text-on-surface-dim/50">(tùy chọn)</span>
  </label>
  <div className="flex gap-2 flex-wrap mb-2">
    {BUDGET_OPTS.map(opt => (
      <button
        key={opt}
        type="button"
        onClick={() => { setBudgetPill(opt === budgetPill ? '' : opt); setBudgetCustom('') }}
        className={`px-3 py-1.5 rounded-full font-label text-label-md border transition-all active:scale-95 ${
          budgetPill === opt
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-surface border-outline-variant text-on-surface-variant'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
  {!budgetPill && (
    <div className="flex items-center gap-2">
      <input
        type="number"
        placeholder="Nhập số tiền..."
        value={budgetCustom}
        onChange={e => setBudgetCustom(e.target.value)}
        className="flex-1 bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-2.5 font-body text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary transition-colors"
      />
      <span className="font-label text-label-md text-on-surface-variant">VNĐ</span>
    </div>
  )}
</div>
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/EntryScreen.jsx
git commit -m "feat: add mood/need textarea and budget quick-select to EntryScreen"
```

---

## Task 6: Forward userNeed + budget through App.jsx to recommendations

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add userNeed + budget state to App.jsx**

Add after the existing `const [location, setLocation] = useState('')`:

```js
const [userNeed, setUserNeed] = useState('')
const [budget, setBudget] = useState('')
```

- [ ] **Step 2: Update handleEntryDone to capture new fields**

Replace:
```js
function handleEntryDone(entryData) {
  setTripType(entryData.tripType)
  setDuration(entryData.duration)
  setLocation(entryData.location)
```
With:
```js
function handleEntryDone(entryData) {
  setTripType(entryData.tripType)
  setDuration(entryData.duration)
  setLocation(entryData.location)
  setUserNeed(entryData.userNeed || '')
  setBudget(entryData.budget || '')
```

- [ ] **Step 3: Add user_need + budget to handleGetRecommendationsWithEntry**

Replace the `api.recommendations({...})` call inside `handleGetRecommendationsWithEntry`:
```js
const data = await api.recommendations({
  primary_vibe: vibe.primary,
  secondary_vibe: vibe.secondary,
  location: entryData.location,
  trip_type: entryData.tripType,
  duration: entryData.duration,
  persona: vibe.persona,
  scores: vibe.axes,
  user_need: entryData.userNeed || '',
  budget: entryData.budget || '',
})
```

- [ ] **Step 4: Add user_need + budget to handleGetRecommendations**

Replace the `api.recommendations({...})` call inside `handleGetRecommendations`:
```js
const data = await api.recommendations({
  primary_vibe: vibeResult.primary,
  secondary_vibe: vibeResult.secondary,
  location,
  trip_type: tripType,
  duration,
  persona: vibeResult.persona,
  scores: vibeResult.axes,
  user_need: userNeed,
  budget,
})
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: forward userNeed and budget from EntryScreen to recommendations API"
```

---

## Task 7: Update YourVibeScreen — radar chart + Đổi tần số button

**Files:**
- Modify: `frontend/src/components/YourVibeScreen.jsx`

- [ ] **Step 1: Read YourVibeScreen.jsx**

Read `frontend/src/components/YourVibeScreen.jsx` fully.

- [ ] **Step 2: Add recharts import and onRetakeQuiz prop**

Add at the top (after existing imports):
```js
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
```

Change the function signature:
```js
export default function YourVibeScreen({ vibeResult, user, onLogout, onRetakeQuiz }) {
```

- [ ] **Step 3: Replace the score grid with radar chart + Đổi tần số button**

Find the `{/* Score grid */}` section:
```jsx
<section className="mb-6">
  <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Điểm vibe của bạn</h3>
  <div className="grid grid-cols-2 gap-3">
    {scoreEntries.map(([vibe, score]) => { ... })}
  </div>
</section>
```

Replace that entire section with:
```jsx
{/* Radar Chart */}
<section className="mb-4">
  <h3 className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mb-3">Travel DNA</h3>
  <div className="bg-surface border border-outline-variant rounded-xl p-4">
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#514255" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'Montserrat' }}
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
  </div>
</section>

{/* Đổi tần số */}
<div className="mb-6">
  <button
    onClick={onRetakeQuiz}
    className="w-full py-3 rounded-full border-2 border-cyber-purple text-cyber-purple font-label text-label-md uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
  >
    ⚡ Đổi tần số
  </button>
</div>
```

- [ ] **Step 4: Add radarData computation (before the return)**

Add after `const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1])`:

```js
const radarData = Object.entries(scores).map(([axis, value]) => ({
  axis,
  value,
  fullMark: 100,
}))
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/YourVibeScreen.jsx
git commit -m "feat: replace score grid with Recharts radar chart, add Đổi tần số button"
```

---

## Task 8: Backend — add user_need + budget to router + executor

**Files:**
- Modify: `backend/recommendations/router.py`
- Modify: `backend/agent/executor.py`

- [ ] **Step 1: Update RecommendationsRequest in router.py**

Read `backend/recommendations/router.py`, then add 2 fields to `RecommendationsRequest`:

```python
class RecommendationsRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    location: str
    trip_type: str
    duration: int = 8
    persona: str | None = None
    scores: dict[str, int] | None = None
    user_need: str | None = None
    budget: str | None = None
```

- [ ] **Step 2: Pass user_need + budget through to run_recommendation_pipeline in router.py**

Replace the `run_recommendation_pipeline(...)` call:

```python
result = await run_recommendation_pipeline(
    primary_vibe=req.primary_vibe,
    secondary_vibe=req.secondary_vibe,
    location=req.location,
    trip_type=req.trip_type,
    duration=req.duration,
    persona=persona,
    axes=axes,
    user_need=req.user_need,
    budget=req.budget,
)
```

- [ ] **Step 3: Update executor.py signature + call**

Read `backend/agent/executor.py`, then replace the function signature and `search_locations` call:

```python
async def run_recommendation_pipeline(
    primary_vibe: str,
    secondary_vibe: str | None,
    location: str,
    trip_type: str,
    duration: int,
    persona: str | None = None,
    axes: dict | None = None,
    user_need: str | None = None,
    budget: str | None = None,
) -> dict:
    resolved_persona = persona or primary_vibe
    resolved_axes = axes or {primary_vibe: 100}

    vibe_info = await describe_vibe(resolved_persona, resolved_axes)
    places = await search_locations(resolved_persona, resolved_axes, location, trip_type, user_need, budget)
    itinerary = await build_itinerary(places, location, trip_type, duration)
    return {
        "vibe_info": vibe_info,
        "places": places,
        "itinerary": itinerary,
    }
```

- [ ] **Step 4: Commit**

```bash
git add backend/recommendations/router.py backend/agent/executor.py
git commit -m "feat: add user_need + budget params through router and executor"
```

---

## Task 9: Backend — translate prompts to English + inject need/budget

**Files:**
- Modify: `backend/agent/tools.py`

- [ ] **Step 1: Read tools.py**

Read `backend/agent/tools.py` fully.

- [ ] **Step 2: Update search_locations signature**

Change:
```python
async def search_locations(
    persona: str,
    axes: dict[str, int],
    location: str,
    trip_type: str,
) -> list[dict]:
```
To:
```python
async def search_locations(
    persona: str,
    axes: dict[str, int],
    location: str,
    trip_type: str,
    user_need: str | None = None,
    budget: str | None = None,
) -> list[dict]:
```

- [ ] **Step 3: Replace search_locations prompt with English version**

Replace the entire `prompt = ChatPromptTemplate.from_messages([...])` block and the `chain.ainvoke({...})` call in `search_locations` with:

```python
need_line = f"\nUser's current mood/need: {user_need}" if user_need else ""
budget_line = f"\nTotal budget: {budget} VND" if budget else ""

trip_label = "day trip" if trip_type == "inday" else "multi-day trip"

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a Vietnam travel expert with up-to-date, real-world local knowledge.

STRICT RULES:
1. ONLY suggest places you are CERTAIN exist right now
2. NEVER invent or hallucinate place names, addresses, or districts
3. MUST include specific address (street + district/ward)
4. Prioritize authentic, less-touristy spots that match the DNA — avoid over-famous landmarks unless truly relevant
5. If uncertain about a place's existence or address, omit it entirely
6. Return 6-8 places maximum

Output: valid JSON array only, no markdown, no explanation."""),
    ("human", """Find places in {location} for a {trip_label}.

Traveler DNA persona: {persona}
Top travel priorities:
{axes_context}
{need_line}
{budget_line}
Preferred place types: {place_type_hint}

Return JSON array of objects:
[{{
  "name": "place name",
  "address": "specific street address",
  "district": "district/ward",
  "type": "food/sightseeing/activity/cafe/bar/nature",
  "description": "1-2 sentence description",
  "why_match": "one sentence why this fits the user's DNA",
  "best_for": "which axis fits best (e.g. Ẩm thực)",
  "price_range": "$ / $$ / $$$ / $$$$"
}}]

Return JSON array only, no other text."""),
])

chain = prompt | llm
result = await chain.ainvoke({
    "persona": persona,
    "axes_context": axes_context,
    "location": location,
    "trip_label": trip_label,
    "place_type_hint": place_type_hint,
    "need_line": need_line,
    "budget_line": budget_line,
})
```

- [ ] **Step 4: Replace build_itinerary prompts with English version**

Replace the `prompt = ChatPromptTemplate.from_messages([...])` block and `chain.ainvoke({...})` in `build_itinerary` with:

```python
unit = "hours" if trip_type == "inday" else "days"

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a Vietnam trip itinerary planner. Return pure JSON array only, no markdown, no explanation."),
    ("human", """Build an itinerary starting from: {origin}
Duration: {duration} {unit}
Places to include: {places}

Sort in optimal geographic order (nearby places together, logical time-of-day flow).

Return JSON array:
[{{
  "time": "9:00" (or "Day 1 - Morning"),
  "name": "place name",
  "address": "address from the list",
  "description": "short engaging description",
  "duration_note": "e.g. ~45 minutes",
  "distance_from_prev": "e.g. ~1.2km, 15 min walk or 5 min Grab",
  "tip": "optional useful tip"
}}]

Return JSON array only."""),
])

chain = prompt | llm
result = await chain.ainvoke({
    "origin": origin,
    "duration": duration,
    "unit": unit,
    "places": places_json,
})
```

- [ ] **Step 5: Commit**

```bash
git add backend/agent/tools.py
git commit -m "feat: translate LLM prompts to English, inject user_need and budget"
```

---

## Task 10: Final build verification

**Files:** none (verification only)

- [ ] **Step 1: Frontend build**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` with no errors.

- [ ] **Step 2: Backend syntax check**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
python -m py_compile backend/agent/tools.py backend/agent/executor.py backend/recommendations/router.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit if any final fixups needed**

```bash
git add -A
git commit -m "fix: final build verification fixups" # only if changes needed
```
