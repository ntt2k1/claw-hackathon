from agent.tools import describe_vibe, search_locations, build_itinerary

async def run_recommendation_pipeline(
    primary_vibe: str,
    secondary_vibe: str | None,
    location: str,
    trip_type: str,
    duration: int,
) -> dict:
    """
    Sequential pipeline: describe_vibe → search_locations → build_itinerary.
    Returns combined result dict.
    """
    vibe_info = await describe_vibe(primary_vibe, secondary_vibe)
    places = await search_locations(primary_vibe, secondary_vibe, location, trip_type)
    itinerary = await build_itinerary(places, location, trip_type, duration)
    return {
        "vibe_info": vibe_info,
        "places": places,
        "itinerary": itinerary,
    }
