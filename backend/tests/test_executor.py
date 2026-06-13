import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_run_recommendation_pipeline_calls_all_tools():
    mock_vibe = {"icon": "🗺️", "description": "desc", "hashtags": ["#Tag"]}
    mock_places = [{"name": "Place A", "type": "tham quan", "description": "desc", "why_vibe": "why"}]
    mock_itinerary = [{"time": "9:00", "name": "Place A", "description": "desc", "duration_note": "1h", "distance_from_prev": "0km"}]

    with patch("agent.executor.describe_vibe", new_callable=AsyncMock, return_value=mock_vibe), \
         patch("agent.executor.search_locations", new_callable=AsyncMock, return_value=mock_places), \
         patch("agent.executor.build_itinerary", new_callable=AsyncMock, return_value=mock_itinerary):
        from agent.executor import run_recommendation_pipeline
        result = await run_recommendation_pipeline("explorer", "foodie", "Quận 1", "inday", 8)
        assert result["vibe_info"]["icon"] == "🗺️"
        assert len(result["places"]) == 1
        assert result["itinerary"][0]["time"] == "9:00"
