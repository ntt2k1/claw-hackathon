# UI: Dynamic Location Label + Onboarding CTA Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two small UI issues — make the location field label context-aware based on trip type, and wire the VibeResult CTA button to navigate to EntryScreen.

**Architecture:** Both changes are frontend-only, no backend involved. Task 1 modifies a single JSX label+input in EntryScreen. Task 2 changes one prop on one JSX element in App.jsx. Changes are independent and can be done in any order.

**Tech Stack:** React 18, Vite, plain JSX, TailwindCSS v3.

---

## Files

| Action | File |
|--------|------|
| Modify | `frontend/src/components/EntryScreen.jsx` |
| Modify | `frontend/src/App.jsx` |

---

### Task 1: Dynamic location label in EntryScreen

**Files:**
- Modify: `frontend/src/components/EntryScreen.jsx` (lines 171–180)

- [ ] **Step 1: Make the label dynamic**

Open `frontend/src/components/EntryScreen.jsx`. Find this block (around line 170–182):

```jsx
      <div className="mb-stack-md">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          📍 Bạn đang ở đâu?
        </label>
        <input
          type="text"
          placeholder="VD: Quận 1, TP.HCM"
          value={location}
          onChange={e => { setLocation(e.target.value); setError('') }}
          className="w-full bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {error && <p className="text-red-400 font-label text-caption mt-1">{error}</p>}
      </div>
```

Replace it with:

```jsx
      <div className="mb-stack-md">
        <label className="font-label text-label-md text-on-surface-variant mb-2 block">
          {tripType === 'inday' ? '📍 Bạn đang ở đâu?' : '🗺️ Bạn muốn đi đâu?'}
        </label>
        <input
          type="text"
          placeholder={tripType === 'inday' ? 'VD: Quận 1, TP.HCM' : 'VD: Đà Lạt, Hội An, Phú Quốc...'}
          value={location}
          onChange={e => { setLocation(e.target.value); setError('') }}
          className="w-full bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {error && <p className="text-red-400 font-label text-caption mt-1">{error}</p>}
      </div>
```

The `tripType` state variable is already declared at line 16 of this file — no new state needed.

- [ ] **Step 2: Verify visually**

Start the dev server if not already running:
```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon/frontend
npm run dev
```

Open the app, navigate to EntryScreen. Confirm:
- Default state (`Trong ngày` selected): label shows `📍 Bạn đang ở đâu?`, placeholder `VD: Quận 1, TP.HCM`
- Switch to `Chuyến xa`: label changes to `🗺️ Bạn muốn đi đâu?`, placeholder changes to `VD: Đà Lạt, Hội An, Phú Quốc...`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/EntryScreen.jsx
git commit -m "feat: dynamic location label based on trip type in EntryScreen"
```

---

### Task 2: Wire VibeResult CTA to navigate to EntryScreen

**Files:**
- Modify: `frontend/src/App.jsx` (line 198)

- [ ] **Step 1: Change the onContinue prop**

Open `frontend/src/App.jsx`. Find line 198 which currently reads:

```jsx
      {screen === 'VIBE'       && <VibeResult vibeResult={vibeResult} onContinue={handleGetRecommendations} />}
```

Replace it with:

```jsx
      {screen === 'VIBE'       && <VibeResult vibeResult={vibeResult} onContinue={() => { setScreen('ENTRY'); setActiveTab('explore') }} />}
```

No other changes to App.jsx or VibeResult.jsx.

- [ ] **Step 2: Verify visually**

With the dev server running, complete the quiz flow (or navigate directly to VIBE screen in dev). Click the "Show Places For Me" button. Confirm:
- User is navigated to EntryScreen
- The bottom nav "explore" tab is active
- EntryScreen allows picking trip type and entering location normally

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: wire VibeResult CTA to navigate to EntryScreen after onboarding"
```
