import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import json

@pytest.mark.asyncio
async def test_save_vibe_profile_calls_insert_directly():
    with patch("memory.service._client") as mock_client:
        mock_client.insert_memory_records_directly_async = AsyncMock()
        from memory.service import save_vibe_profile
        profile = {"primary_vibe": "explorer", "secondary_vibe": "foodie", "scores": {}}
        await save_vibe_profile("user-123", profile)
        mock_client.insert_memory_records_directly_async.assert_called_once()
        call_kwargs = mock_client.insert_memory_records_directly_async.call_args
        assert "user-123" in str(call_kwargs)
        assert "explorer" in str(call_kwargs)

@pytest.mark.asyncio
async def test_get_vibe_profile_returns_none_when_no_records():
    with patch("memory.service._client") as mock_client:
        mock_client.list_memory_records_async = AsyncMock(return_value=[])
        from memory.service import get_vibe_profile
        result = await get_vibe_profile("user-123")
        assert result is None

@pytest.mark.asyncio
async def test_get_vibe_profile_parses_json():
    profile = {"primary_vibe": "foodie", "scores": {"foodie": 23}}
    mock_record = MagicMock()
    mock_record.memory = json.dumps(profile)
    with patch("memory.service._client") as mock_client:
        mock_client.list_memory_records_async = AsyncMock(return_value=[mock_record])
        from memory.service import get_vibe_profile
        result = await get_vibe_profile("user-123")
        assert result["primary_vibe"] == "foodie"
        assert result["scores"]["foodie"] == 23
