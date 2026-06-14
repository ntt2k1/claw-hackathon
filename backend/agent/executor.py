from agent.tools import describe_vibe, search_locations, build_itinerary

async def run_recommendation_pipeline(
    primary_vibe: str,
    secondary_vibe: str | None,
    location: str,
    trip_type: str,
    duration: int,
    persona: str | None = None,
    axes: dict | None = None,
) -> dict:
    """
    Sequential pipeline: describe_vibe → search_locations → build_itinerary.
    Uses DNA persona + axes when available, falls back to primary_vibe string.
    """
    resolved_persona = persona or primary_vibe
    resolved_axes = axes or {primary_vibe: 100}

    vibe_info = await describe_vibe(resolved_persona, resolved_axes)
    places = await search_locations(resolved_persona, resolved_axes, location, trip_type)
    itinerary = await build_itinerary(places, location, trip_type, duration)
    return {
        "vibe_info": vibe_info,
        "places": places,
        "itinerary": itinerary,
    }
