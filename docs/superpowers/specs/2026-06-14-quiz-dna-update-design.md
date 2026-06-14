# Quiz DNA Update — Design Spec

**Date:** 2026-06-14

## Overview

Replace the current 5-vibe quiz system with the 10-question SOLE DNA quiz from the PRD. Scoring produces a normalized vector across 10 DNA axes, which maps to a persona archetype shown on the Vibe Result screen.

---

## DNA Axes

10 axes (Vietnamese labels used throughout codebase):

| Axis | Key |
|------|-----|
| Ẩm thực | food |
| Văn hoá | culture |
| Thiên nhiên | nature |
| Phiêu lưu | adventure |
| Sang chảnh | luxury |
| Giao lưu | social |
| Tọa độ ngách | hiddenGem |
| Thư giãn | relax |
| Nhiếp ảnh | photography |
| Hiệu quả | efficiency |

---

## Questions Data (`frontend/src/data/questions.js`)

Replace `SINGLE_CHOICE_QUESTIONS` and `RATING_QUESTIONS` exports with a single `QUESTIONS` array of 10 objects.

Each question object:
```js
{
  num: 1,                        // 1–10
  group: "Nhóm A — ...",         // group label
  question: "...",               // question text
  options: [
    {
      letter: "A",
      label: "...",              // short label shown on button
      imgDesc: "...",            // description for Unsplash alt text
      img: "https://...",        // Unsplash URL (from sole_ui/src/data.ts)
      scores: { "Ẩm thực": 5 }  // axis → raw score (can be negative e.g. -2)
    }
  ]
}
```

Exact question data copied from `example/ui/sole_ui/src/data.ts` (10 questions, already validated in PRD).

Also export `MAX_POSSIBLE` object (max achievable raw score per axis, used for normalization):
```js
export const MAX_POSSIBLE = {
  "Ẩm thực": 19, "Văn hoá": 12, "Thiên nhiên": 11, "Phiêu lưu": 23,
  "Sang chảnh": 19, "Giao lưu": 10, "Tọa độ ngách": 16,
  "Thư giãn": 21, "Nhiếp ảnh": 12, "Hiệu quả": 14,
}
```

Also export `PERSONA_MAP` array (6 personas + fallback) copied from `sole_ui/src/data.ts`.

Remove old exports: `SINGLE_CHOICE_QUESTIONS`, `RATING_QUESTIONS`.

---

## Scoring (`frontend/src/utils/scoring.js`)

Replace `calculateScores()` with new function signature:

```js
export function calculateScores(answers)
// answers: [{questionNum, selectedOption}]
// returns: { axes, primary, secondary, persona, tagline, accentColor }
```

Algorithm:
1. Accumulate raw scores per axis from `answers` (match `questionNum` + `selectedOption` to `QUESTIONS`)
2. Clamp each axis raw score to minimum 0 (negative scores shouldn't go below 0)
3. Normalize each axis: `Math.round((raw / MAX_POSSIBLE[axis]) * 100)` → 0–100
4. Sort axes descending by normalized score → `top3 = first 3`
5. Find persona: find first `PERSONA_MAP` entry where all `entry.key` axes appear in `top3` map (or use fallback)
6. Return:
   ```js
   {
     axes: { "Ẩm thực": 87, "Phiêu lưu": 65, ... },  // all 10, normalized
     primary: "Ẩm thực",       // highest axis key
     secondary: "Phiêu lưu",   // second axis key
     persona: "Kẻ Khám Phá Bản Địa",
     tagline: "Ẩm thực local, ngách, không theo đám đông",
     accentColor: "#BD00FF",
   }
   ```

---

## Quiz Flow (`frontend/src/App.jsx`)

**Remove:** QUIZ3 screen, `RatingScreen` component usage, `handleQuiz3Done`, `ratingAnswers` state.

**Keep:** QUIZ1 (Q1–5) and QUIZ2 (Q6–10) screens using `QuizScreen`.

**Update splits:**
```js
const screen1Qs = QUESTIONS.filter((_, i) => i < 5)   // Q1–Q5
const screen2Qs = QUESTIONS.filter((_, i) => i >= 5)  // Q6–Q10
```

**handleQuiz1Done:** accumulate answers array (partial), go to QUIZ2.

**handleQuiz2Done:** merge all answers, call `calculateScores(allAnswers)`, set `vibeResult`, call `api.quizComplete(...)`, go to `'VIBE'`.

**vibeResult shape** (new):
```js
{ axes, primary, secondary, persona, tagline, accentColor }
```

**`singleAnswers` state** changes from `{}` (object) to `[]` (array of `{questionNum, selectedOption}`).

---

## QuizScreen Component (`frontend/src/components/QuizScreen.jsx`)

**Props change:** receives `questions` array in new format (with `options[].scores` object, `options[].img`, `options[].letter`).

**onDone signature:** `onDone(answers: [{questionNum, selectedOption}[]])` — returns array of answer objects.

**UI:** each option shows image + label. Current implementation likely already handles this pattern — minimal changes needed.

---

## VibeResult Component (`frontend/src/components/VibeResult.jsx`)

Update to use new `vibeResult` shape:
- Show `vibeResult.persona` as headline (e.g. "Kẻ Khám Phá Bản Địa")
- Show `vibeResult.tagline` as subtitle
- Show top 3–4 axes as score tiles (from `vibeResult.axes`, sorted desc)
- Remove old 5-vibe display logic

---

## Backend (`backend/recommendations/router.py`)

**`QuizCompleteRequest` schema update:**
```python
class QuizCompleteRequest(BaseModel):
    primary_vibe: str           # primary axis (Vietnamese label)
    secondary_vibe: str | None = None
    scores: dict[str, int]      # all 10 axes normalized 0–100
    persona: str | None = None  # persona name
```

Stored in AgentBase Memory as-is. No other backend changes for this sub-project.

---

## Out of Scope (this sub-project)
- UI visual redesign (Sub-project 2)
- Recommendation prompt changes (Sub-project 3)
- Unsplash images in QuizScreen (nice-to-have, not required)
