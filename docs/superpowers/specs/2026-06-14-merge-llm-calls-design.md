# Merge LLM Calls — Design Spec

## Goal

Reduce recommendation API latency ~40-50% by merging two sequential LLM calls (`search_locations` + `build_itinerary`) into a single `search_and_plan` call that returns both places and itinerary in one JSON response.

## Current State

```
describe_vibe (instant) → search_locations (LLM call 1) → build_itinerary (LLM call 2)
```

Total: 2 LLM roundtrips, sequential. Each roundtrip adds ~2-3 minutes.

## Target State

```
describe_vibe (instant) → search_and_plan (LLM call 1)
```

Total: 1 LLM roundtrip. Expected reduction: ~40-50% of current total time.

---

## Architecture

### Files to change

| File | Change |
|------|--------|
| `backend/agent/tools.py` | Remove `search_locations` + `build_itinerary`, add `search_and_plan` |
| `backend/agent/executor.py` | Update pipeline to call `search_and_plan` |

Frontend and API contract **unchanged** — response shape stays `{ vibe_info, places, itinerary }`.

---

## `search_and_plan` Function Spec

### Signature

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
```

### System prompt (English)

```
You are a Vietnam travel expert and itinerary planner with up-to-date local knowledge.

STRICT RULES:
1. ONLY suggest places you are CERTAIN exist
2. NEVER invent place names, addresses, or districts
3. MUST include specific address (street + district/ward) for each place
4. Prioritize authentic, less-touristy spots matching the DNA over overcrowded landmarks
5. If uncertain about a place's exact address, omit it
6. Return 5-6 places maximum

Output: valid JSON object only, no markdown, no explanation.
```

### Human message (English, with optional injections)

```
Find places and build an itinerary in {location} for a {trip_type}.

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
}}
```

### `ainvoke` variables

```python
{
    "persona": persona,
    "axes_context": axes_context,       # same top-3 logic as before
    "location": location,
    "trip_type": "day trip" | "multi-day trip",
    "duration": duration,
    "unit": "hours" | "days",
    "place_type_hint": place_type_hint, # same mapping as before
    "need_line": need_line,             # conditional, same as search_locations
    "budget_line": budget_line,         # conditional, same as search_locations
}
```

---

## `executor.py` Changes

```python
async def run_recommendation_pipeline(...) -> dict:
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

---

## Kept Unchanged

- `describe_vibe` — no LLM, pure dict lookup, keep as-is
- `PERSONA_DESCRIPTIONS`, `AXIS_VI`, `_get_llm`, `AXIS_VI` mapping — all kept
- `place_type_hint` mapping logic — copy into `search_and_plan`
- Top-3 axes context building — copy into `search_and_plan`
- `need_line` / `budget_line` injection — copy into `search_and_plan`
- Frontend `Itinerary.jsx`, `api.js`, `App.jsx` — no changes
- Backend `router.py` — no changes

## Response JSON parsing

Same strip-markdown pattern already used in `search_locations` and `build_itinerary`:

```python
text = result.content.strip()
if text.startswith("```"):
    lines = text.split("\n")
    text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
return json.loads(text)
```
