# UI: Dynamic Location Label + Onboarding CTA Fix — Design Spec

## Goal

Two small frontend-only UI fixes:
1. Location field label in EntryScreen changes dynamically based on trip type selection
2. The "Show Places For Me" button in VibeResult (shown after quiz/onboarding) navigates to EntryScreen instead of failing silently

---

## Change 1: Dynamic Location Label in EntryScreen

**File:** `frontend/src/components/EntryScreen.jsx`

**Current behavior:** Label is hardcoded to `📍 Bạn đang ở đâu?` and placeholder to `VD: Quận 1, TP.HCM` regardless of trip type.

**New behavior:** Label and placeholder change based on the `tripType` state (already present in component):

| `tripType` | Label | Placeholder |
|---|---|---|
| `'inday'` | `📍 Bạn đang ở đâu?` | `VD: Quận 1, TP.HCM` |
| `'multiday'` | `🗺️ Bạn muốn đi đâu?` | `VD: Đà Lạt, Hội An, Phú Quốc...` |

**Implementation:** Replace the static label text and placeholder attribute at lines 171–176 with conditional expressions driven by `tripType`. No state changes, no data flow changes.

---

## Change 2: VibeResult CTA → Navigate to EntryScreen

**Files:**
- `frontend/src/App.jsx` — line 198
- No change to `VibeResult.jsx` itself

**Current behavior:** `VibeResult` receives `onContinue={handleGetRecommendations}`. That function (line 120) validates `location` — which is empty at this point because the user went through quiz without setting a location — and fails silently (no navigation, no error shown).

**New behavior:** Pass `onContinue={() => { setScreen('ENTRY'); setActiveTab('explore') }}` inline instead of `handleGetRecommendations`. This navigates user to EntryScreen where they can fill in location + trip type, then proceed to recommendations normally.

The existing `handleGetRecommendations` function is still used when the user arrives at VibeResult via ENTRY → quiz → VIBE (future path where location is already set is not the issue here). This change only affects the prop passed to VibeResult.

**No changes needed to:** VibeResult.jsx, the button label, EntryScreen submit logic, or any other component.
