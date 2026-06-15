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
    disliked_places: list[str] | None = None,
) -> dict:
    """
    Pipeline: describe_vibe (instant) → search_and_plan (single LLM call).
    Returns vibe_info, places, and itinerary in one response.
    """
    resolved_persona = persona or primary_vibe
    resolved_axes = axes or {primary_vibe: 100}

    vibe_info = await describe_vibe(resolved_persona, resolved_axes)
    result = await search_and_plan(
        resolved_persona, resolved_axes, location, trip_type, duration, user_need, budget, disliked_places
    )
    return {
        "vibe_info": vibe_info,
        "places": result["places"],
        "itinerary": result["itinerary"],
    }
