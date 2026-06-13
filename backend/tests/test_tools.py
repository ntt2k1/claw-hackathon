import pytest
from agent.tools import describe_vibe

@pytest.mark.asyncio
async def test_describe_vibe_explorer():
    result = await describe_vibe("explorer", None)
    assert "Explorer" in result["icon"]
    assert len(result["description"]) > 20
    assert "#HiddenGems" in result["hashtags"]

@pytest.mark.asyncio
async def test_describe_vibe_with_secondary():
    result = await describe_vibe("foodie", "explorer")
    assert len(result["hashtags"]) >= 4  # 3 primary + 1 secondary

@pytest.mark.asyncio
async def test_describe_vibe_unknown_falls_back():
    result = await describe_vibe("unknown_vibe", None)
    assert "description" in result
    assert "hashtags" in result
