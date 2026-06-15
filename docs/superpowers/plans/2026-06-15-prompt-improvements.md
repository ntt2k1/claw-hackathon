# Prompt Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve `search_and_plan` with 3 enhancements: inject current date/season into the prompt, exclude previously-disliked places, and post-filter results by budget.

**Architecture:** All changes are backend-only. Task 1 modifies `tools.py` to add date context and budget filtering. Task 2 adds the `_allowed_price_ranges` helper and filter logic to `tools.py`. Task 3 threads `disliked_places` from `router.py` → `executor.py` → `tools.py` and injects them into the prompt. Changes are additive — no existing behaviour is removed.

**Tech Stack:** Python 3.12, FastAPI, LangChain `ChatPromptTemplate`, AgentBase Memory SDK (`get_place_ratings`).

---

## Files

| Action | File |
|--------|------|
| Modify | `backend/agent/tools.py` |
| Modify | `backend/agent/executor.py` |
| Modify | `backend/recommendations/router.py` |

---

### Task 1: Inject current date + Vietnam season into prompt

**Files:**
- Modify: `backend/agent/tools.py`

- [ ] **Step 1: Add `datetime` import and `_vietnam_season` helper at the top of `tools.py`**

Open `backend/agent/tools.py`. After the existing imports block (currently lines 1–7), add:

```python
from datetime import datetime
```

Then, after `logger = logging.getLogger(__name__)` and before `def _get_llm(...)`, insert the helper function:

```python
def _vietnam_season(month: int) -> str:
    if month in (12, 1, 2):
        return "Dry/Cool season"
    elif month in (3, 4, 5):
        return "Hot season"
    elif month in (6, 7, 8):
        return "Rainy season"
    else:  # 9, 10, 11
        return "Dry/Cool season"
```

- [ ] **Step 2: Build `date_line` inside `search_and_plan` and add it to `invoke_vars`**

Inside `search_and_plan()`, directly after the line `budget_line = f"\nTotal budget: {budget} VND" if budget else ""`, add:

```python
now = datetime.now()
season = _vietnam_season(now.month)
date_line = f"\nCurrent date: {now.strftime('%A, %B %d, %Y')} ({season})"
```

- [ ] **Step 3: Add `{date_line}` to the Human message template**

In the `ChatPromptTemplate.from_messages([...])` call, find the Human message string. After the `{budget_line}` placeholder, add `{date_line}` on its own line:

```
...
{need_line}
{budget_line}
{date_line}
Duration: {duration} {unit}
...
```

The full Human message template after the change:

```python
        ("human", """Find places and build an itinerary in {location} for a {trip_type}.

Traveler DNA persona: {persona}
Top travel axes:
{axes_context}
{need_line}
{budget_line}
{date_line}
Duration: {duration} {unit}
Priority place type: {place_type_hint}

Return a JSON object:
{{
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
  "itinerary": [
    {{
      "time": "9:00 (or Day 1 - Morning)",
      "name": "place name from places list",
      "address": "address from places list",
      "description": "short engaging description",
      "duration_note": "e.g. ~45 min",
      "distance_from_prev": "e.g. ~1.2km, 15 min walk or 5 min Grab",
      "tip": "optional useful tip"
    }}
  ]
}}"""),
```

- [ ] **Step 4: Add `date_line` to `invoke_vars`**

In the `invoke_vars` dict (just before the `rendered = prompt.format_messages(...)` block), add the new key:

```python
    invoke_vars = {
        "persona": persona,
        "axes_context": axes_context,
        "location": location,
        "trip_type": "day trip" if trip_type == "inday" else "multi-day trip",
        "duration": duration,
        "unit": "hours" if trip_type == "inday" else "days",
        "place_type_hint": place_type_hint,
        "need_line": need_line,
        "budget_line": budget_line,
        "date_line": date_line,
    }
```

- [ ] **Step 5: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
python3 -m py_compile backend/agent/tools.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add backend/agent/tools.py
git commit -m "feat: inject current date and Vietnam season into search_and_plan prompt"
```

---

### Task 2: Post-filter places and itinerary by budget

**Files:**
- Modify: `backend/agent/tools.py`

- [ ] **Step 1: Add `_allowed_price_ranges` helper to `tools.py`**

After `_vietnam_season` and before `def _get_llm(...)`, insert:

```python
def _allowed_price_ranges(budget: str | None) -> set[str] | None:
    """Map a budget string to allowed price_range tiers, or None for no filter."""
    if not budget:
        return None
    b = budget.upper().replace("+", "").replace(",", "").replace(".", "")
    if b.endswith("K"):
        val = float(b[:-1]) * 1_000
    elif b.endswith("M"):
        val = float(b[:-1]) * 1_000_000
    else:
        try:
            val = float(b)
        except ValueError:
            return None
    if val <= 500_000:
        return {"$"}
    elif val <= 2_000_000:
        return {"$", "$$"}
    elif val < 5_000_000:
        return {"$", "$$", "$$$"}
    return None  # 5M+ = no filter
```

- [ ] **Step 2: Replace the final `return json.loads(text)` with filter logic**

Find the current last lines of `search_and_plan()`:

```python
    text = result.content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)
```

Replace with:

```python
    text = result.content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    data = json.loads(text)

    allowed = _allowed_price_ranges(budget)
    if allowed:
        places = [p for p in data["places"] if p.get("price_range", "$") in allowed]
        kept_names = {p["name"] for p in places}
        itinerary = [s for s in data["itinerary"] if s.get("name") in kept_names]
    else:
        places = data["places"]
        itinerary = data["itinerary"]

    return {"places": places, "itinerary": itinerary}
```

- [ ] **Step 3: Verify syntax**

```bash
python3 -m py_compile backend/agent/tools.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/agent/tools.py
git commit -m "feat: post-filter places and itinerary by budget price_range"
```

---

### Task 3: Exclude disliked places via prompt injection

**Files:**
- Modify: `backend/agent/tools.py`
- Modify: `backend/agent/executor.py`
- Modify: `backend/recommendations/router.py`

- [ ] **Step 1: Add `disliked_places` param and `avoid_line` to `search_and_plan` in `tools.py`**

Change the function signature from:

```python
async def search_and_plan(
    persona: str,
    axes: dict[str, int],
    location: str,
    trip_type: str,
    duration: int,
    user_need: str | None = None,
    budget: str | None = None,
) -> dict:
```

To:

```python
async def search_and_plan(
    persona: str,
    axes: dict[str, int],
    location: str,
    trip_type: str,
    duration: int,
    user_need: str | None = None,
    budget: str | None = None,
    disliked_places: list[str] | None = None,
) -> dict:
```

Then, directly after the `date_line = ...` line, add:

```python
    if disliked_places:
        avoid_line = "\nDo NOT suggest these places (user has previously disliked them):\n" + "\n".join(f"- {p}" for p in disliked_places)
    else:
        avoid_line = ""
```

- [ ] **Step 2: Add `{avoid_line}` to the Human message template**

In the Human message template, add `{avoid_line}` after `{date_line}`:

```
{need_line}
{budget_line}
{date_line}
{avoid_line}
Duration: {duration} {unit}
```

The full updated Human message template:

```python
        ("human", """Find places and build an itinerary in {location} for a {trip_type}.

Traveler DNA persona: {persona}
Top travel axes:
{axes_context}
{need_line}
{budget_line}
{date_line}
{avoid_line}
Duration: {duration} {unit}
Priority place type: {place_type_hint}

Return a JSON object:
{{
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
  "itinerary": [
    {{
      "time": "9:00 (or Day 1 - Morning)",
      "name": "place name from places list",
      "address": "address from places list",
      "description": "short engaging description",
      "duration_note": "e.g. ~45 min",
      "distance_from_prev": "e.g. ~1.2km, 15 min walk or 5 min Grab",
      "tip": "optional useful tip"
    }}
  ]
}}"""),
```

- [ ] **Step 3: Add `avoid_line` to `invoke_vars` in `tools.py`**

```python
    invoke_vars = {
        "persona": persona,
        "axes_context": axes_context,
        "location": location,
        "trip_type": "day trip" if trip_type == "inday" else "multi-day trip",
        "duration": duration,
        "unit": "hours" if trip_type == "inday" else "days",
        "place_type_hint": place_type_hint,
        "need_line": need_line,
        "budget_line": budget_line,
        "date_line": date_line,
        "avoid_line": avoid_line,
    }
```

- [ ] **Step 4: Add `disliked_places` param to `run_recommendation_pipeline` in `executor.py`**

Change the function signature from:

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
```

To:

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
    disliked_places: list[str] | None = None,
) -> dict:
```

And update the `search_and_plan` call to pass it through:

```python
    result = await search_and_plan(
        resolved_persona, resolved_axes, location, trip_type, duration,
        user_need, budget, disliked_places
    )
```

- [ ] **Step 5: Fetch disliked places in `router.py` and pass to pipeline**

In `backend/recommendations/router.py`, inside the `get_recommendations` endpoint, after the `if not persona or not axes:` block and before the `try:` block, add:

```python
    try:
        ratings = await get_place_ratings(user_id)
        disliked = [r["placeName"] for r in ratings if r.get("rating") == "dislike"]
    except Exception:
        disliked = []
```

Then update the `run_recommendation_pipeline` call to pass `disliked_places=disliked`:

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
            disliked_places=disliked,
        )
```

- [ ] **Step 6: Verify all three files compile**

```bash
python3 -m py_compile backend/agent/tools.py backend/agent/executor.py backend/recommendations/router.py && echo "All OK"
```

Expected: `All OK`

- [ ] **Step 7: Commit**

```bash
git add backend/agent/tools.py backend/agent/executor.py backend/recommendations/router.py
git commit -m "feat: exclude disliked places from search_and_plan prompt"
```
