# Merge LLM Calls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace two sequential LLM calls (`search_locations` + `build_itinerary`) with a single `search_and_plan` call, reducing recommendation API latency ~40-50%.

**Architecture:** `describe_vibe` (instant dict lookup) remains unchanged. `search_locations` and `build_itinerary` are deleted and replaced by `search_and_plan`, which asks the LLM to return both places and itinerary in one JSON object. `executor.py` is updated to call `search_and_plan` instead of the two old functions.

**Tech Stack:** Python 3.11+, LangChain (`ChatPromptTemplate`, `ChatOpenAI`), FastAPI (no changes needed).

---

## Files

| Action | File |
|--------|------|
| Modify | `backend/agent/tools.py` |
| Modify | `backend/agent/executor.py` |

---

### Task 1: Add `search_and_plan` to `tools.py`

**Files:**
- Modify: `backend/agent/tools.py`

- [ ] **Step 1: Add `search_and_plan` function after `describe_vibe`**

Open `backend/agent/tools.py`. After the `describe_vibe` function (line 42), insert the new function. Keep `search_locations` and `build_itinerary` in place for now (they are removed in Task 2).

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
    """Returns {"places": [...], "itinerary": [...]} in a single LLM call."""
    llm = _get_llm(temperature=0.3)

    top3 = sorted(axes.items(), key=lambda x: x[1], reverse=True)[:3]
    axes_context = "\n".join(
        f"- {axis} ({score}%): {AXIS_VI.get(axis, axis)}"
        for axis, score in top3
    )

    top_axis = top3[0][0] if top3 else "Phiêu lưu"
    place_type_hint = {
        "Ẩm thực": "restaurants, local eateries, food markets, specialty cafes",
        "Văn hoá": "museums, heritage sites, old quarters, art galleries, architecture",
        "Thiên nhiên": "parks, lakes, mountains, gardens, eco spots",
        "Phiêu lưu": "challenging terrain, outdoor activities, hiking, kayaking",
        "Sang chảnh": "boutique hotels, spas, fine dining, rooftop lounges",
        "Giao lưu": "rooftop bars, live music venues, community spaces, night markets",
        "Tọa độ ngách": "hidden cafes, back-alley spots, local-only places",
        "Thư giãn": "quiet cafes, gardens, reading spaces, small resorts",
        "Nhiếp ảnh": "scenic streets, unique architecture, aesthetic cafes, viewpoints",
        "Hiệu quả": "central hubs, well-connected areas, clustered attractions",
    }.get(top_axis, "notable, distinctive spots")

    need_line = f"\nUser's current mood/need: {user_need}" if user_need else ""
    budget_line = f"\nTotal budget: {budget} VND" if budget else ""

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Vietnam travel expert and itinerary planner with up-to-date local knowledge.

STRICT RULES:
1. ONLY suggest places you are CERTAIN exist
2. NEVER invent place names, addresses, or districts
3. MUST include specific address (street + district/ward) for each place
4. Prioritize authentic, less-touristy spots matching the DNA over overcrowded landmarks
5. If uncertain about a place's exact address, omit it
6. Return 5-6 places maximum

Output: valid JSON object only, no markdown, no explanation."""),
        ("human", """Find places and build an itinerary in {location} for a {trip_type}.

Traveler DNA persona: {persona}
Top travel axes:
{axes_context}
{need_line}
{budget_line}
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
    ])

    chain = prompt | llm
    result = await chain.ainvoke({
        "persona": persona,
        "axes_context": axes_context,
        "location": location,
        "trip_type": "day trip" if trip_type == "inday" else "multi-day trip",
        "duration": duration,
        "unit": "hours" if trip_type == "inday" else "days",
        "place_type_hint": place_type_hint,
        "need_line": need_line,
        "budget_line": budget_line,
    })

    text = result.content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)
```

- [ ] **Step 2: Verify syntax**

```bash
cd /path/to/project && python3 -m py_compile backend/agent/tools.py && echo "OK"
```

Expected: `OK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/agent/tools.py
git commit -m "feat: add search_and_plan combining search + itinerary into one LLM call"
```

---

### Task 2: Remove old functions from `tools.py`

**Files:**
- Modify: `backend/agent/tools.py`

- [ ] **Step 1: Delete `search_locations` and `build_itinerary`**

Remove the entire `search_locations` function (currently lines 44–121) and the entire `build_itinerary` function (currently lines 124–162) from `backend/agent/tools.py`.

The file after this task should contain only:
- `_get_llm`
- `PERSONA_DESCRIPTIONS`
- `AXIS_VI`
- `describe_vibe`
- `search_and_plan`

- [ ] **Step 2: Verify syntax**

```bash
python3 -m py_compile backend/agent/tools.py && echo "OK"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add backend/agent/tools.py
git commit -m "refactor: remove search_locations and build_itinerary (replaced by search_and_plan)"
```

---

### Task 3: Update `executor.py` to use `search_and_plan`

**Files:**
- Modify: `backend/agent/executor.py`

- [ ] **Step 1: Replace the pipeline in `executor.py`**

Replace the entire contents of `backend/agent/executor.py` with:

```python
from agent.tools import describe_vibe, search_and_plan

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
    """
    Pipeline: describe_vibe (instant) → search_and_plan (single LLM call).
    Returns vibe_info, places, and itinerary in one response.
    """
    resolved_persona = persona or primary_vibe
    resolved_axes = axes or {primary_vibe: 100}

    vibe_info = await describe_vibe(resolved_persona, resolved_axes)
    result = await search_and_plan(
        resolved_persona, resolved_axes, location, trip_type, duration, user_need, budget
    )
    return {
        "vibe_info": vibe_info,
        "places": result["places"],
        "itinerary": result["itinerary"],
    }
```

- [ ] **Step 2: Verify both files compile**

```bash
python3 -m py_compile backend/agent/executor.py backend/agent/tools.py && echo "OK"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add backend/agent/executor.py
git commit -m "feat: update pipeline to use single search_and_plan LLM call"
```

---

### Task 4: Final verification

**Files:**
- Read: `backend/recommendations/router.py` (confirm no import of deleted functions)

- [ ] **Step 1: Confirm router still imports only from executor**

```bash
grep -n "search_locations\|build_itinerary" backend/recommendations/router.py backend/agent/executor.py
```

Expected: no matches (both old function names gone from all files).

- [ ] **Step 2: Confirm tools.py no longer exports old functions**

```bash
grep -n "def search_locations\|def build_itinerary" backend/agent/tools.py
```

Expected: no matches.

- [ ] **Step 3: Full compile check**

```bash
python3 -m py_compile backend/agent/tools.py backend/agent/executor.py backend/recommendations/router.py && echo "All OK"
```

Expected: `All OK`.

- [ ] **Step 4: Commit verification tag**

```bash
git add -A
git commit -m "chore: verify merge-llm-calls refactor compiles cleanly" --allow-empty
```

(Use `--allow-empty` only if there are no staged changes — the verify step is a no-op if everything was committed in previous tasks.)
